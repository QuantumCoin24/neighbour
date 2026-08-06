import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { MarketplaceListingStatus, Prisma } from '../../generated/prisma/client';
import { DatabaseService } from '../../database/database.service';
import type { CreateMarketplaceListingDto } from './dto/create-marketplace-listing.dto';
import type { SearchMarketplaceListingsDto } from './dto/search-marketplace-listings.dto';
import type { UpdateMarketplaceListingDto } from './dto/update-marketplace-listing.dto';
import type {
  MarketplaceListingPageResponse,
  MarketplaceListingResponse,
} from './interfaces/marketplace-listing-response.interface';

const listingInclude = {
  seller: {
    include: {
      profile: true,
    },
  },
  community: true,
  media: {
    where: {
      media: {
        status: 'READY',
        deletedAt: null,
      },
    },
    include: {
      media: true,
    },
    orderBy: {
      position: 'asc',
    },
  },
  savedBy: {
    select: {
      userId: true,
    },
  },
  _count: {
    select: {
      savedBy: true,
    },
  },
} satisfies Prisma.MarketplaceListingInclude;

type ListingWithRelations = Prisma.MarketplaceListingGetPayload<{
  include: typeof listingInclude;
}>;

@Injectable()
export class MarketplaceListingService {
  constructor(private readonly database: DatabaseService) {}

  async create(
    sellerId: string,
    dto: CreateMarketplaceListingDto,
  ): Promise<MarketplaceListingResponse> {
    this.validatePricing(dto);

    const mediaIds = [...new Set(dto.mediaIds ?? [])];

    if (mediaIds.length !== (dto.mediaIds ?? []).length) {
      throw new BadRequestException('Duplicate media assets are not allowed.');
    }

    if (dto.communityId) {
      await this.requireCommunityMembership(sellerId, dto.communityId);
    }

    if (mediaIds.length > 0) {
      await this.requireOwnedReadyMedia(sellerId, mediaIds);
    }

    const status = dto.status ?? MarketplaceListingStatus.DRAFT;

    const listing = await this.database.marketplaceListing.create({
      data: {
        sellerId,
        communityId: dto.communityId ?? null,
        title: dto.title.trim(),
        description: dto.description.trim(),
        category: dto.category,
        condition: dto.condition,
        status,
        pricePence: dto.isFree === true ? null : (dto.pricePence ?? null),
        isFree: dto.isFree ?? false,
        acceptsOffers: dto.acceptsOffers ?? false,
        collectionAvailable: dto.collectionAvailable ?? true,
        deliveryAvailable: dto.deliveryAvailable ?? false,
        postageAvailable: dto.postageAvailable ?? false,
        localArea: dto.localArea?.trim() || null,
        postcodeDistrict: dto.postcodeDistrict?.trim().toUpperCase() || null,
        ...(dto.latitude !== undefined
          ? {
              latitude: dto.latitude,
            }
          : {}),
        ...(dto.longitude !== undefined
          ? {
              longitude: dto.longitude,
            }
          : {}),
        publishedAt: status === MarketplaceListingStatus.PUBLISHED ? new Date() : null,
        media: {
          create: mediaIds.map((mediaId, position) => ({
            mediaId,
            position,
          })),
        },
      },
      include: listingInclude,
    });

    return this.map(listing, sellerId);
  }

  async search(
    currentUserId: string,
    query: SearchMarketplaceListingsDto,
  ): Promise<MarketplaceListingPageResponse> {
    const where: Prisma.MarketplaceListingWhereInput = {
      status: MarketplaceListingStatus.PUBLISHED,
      deletedAt: null,
      ...(query.communityId
        ? {
            communityId: query.communityId,
          }
        : {}),
      ...(query.category
        ? {
            category: query.category,
          }
        : {}),
      ...(query.condition
        ? {
            condition: query.condition,
          }
        : {}),
      ...(query.freeOnly
        ? {
            isFree: true,
          }
        : {}),
      ...(query.minPricePence !== undefined || query.maxPricePence !== undefined
        ? {
            pricePence: {
              ...(query.minPricePence !== undefined
                ? {
                    gte: query.minPricePence,
                  }
                : {}),
              ...(query.maxPricePence !== undefined
                ? {
                    lte: query.maxPricePence,
                  }
                : {}),
            },
          }
        : {}),
      ...(query.query
        ? {
            OR: [
              {
                title: {
                  contains: query.query,
                  mode: 'insensitive',
                },
              },
              {
                description: {
                  contains: query.query,
                  mode: 'insensitive',
                },
              },
              {
                localArea: {
                  contains: query.query,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };

    const rows = await this.database.marketplaceListing.findMany({
      where,
      include: listingInclude,
      orderBy: [
        {
          publishedAt: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
      take: query.limit + 1,
      ...(query.cursor
        ? {
            cursor: {
              id: query.cursor,
            },
            skip: 1,
          }
        : {}),
    });

    const hasNext = rows.length > query.limit;

    const items = hasNext ? rows.slice(0, query.limit) : rows;

    return {
      items: items.map((listing) => this.map(listing, currentUserId)),
      nextCursor: hasNext ? (items.at(-1)?.id ?? null) : null,
    };
  }

  async findOne(currentUserId: string, listingId: string): Promise<MarketplaceListingResponse> {
    const listing = await this.database.marketplaceListing.findFirst({
      where: {
        id: listingId,
        deletedAt: null,
        OR: [
          {
            status: MarketplaceListingStatus.PUBLISHED,
          },
          {
            sellerId: currentUserId,
          },
        ],
      },
      include: listingInclude,
    });

    if (!listing) {
      throw new NotFoundException('Marketplace listing not found.');
    }

    if (
      listing.sellerId !== currentUserId &&
      listing.status === MarketplaceListingStatus.PUBLISHED
    ) {
      await this.database.marketplaceListing.update({
        where: {
          id: listing.id,
        },
        data: {
          viewCount: {
            increment: 1,
          },
        },
      });

      listing.viewCount += 1;
    }

    return this.map(listing, currentUserId);
  }

  async findMine(sellerId: string): Promise<MarketplaceListingResponse[]> {
    const listings = await this.database.marketplaceListing.findMany({
      where: {
        sellerId,
        deletedAt: null,
      },
      include: listingInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return listings.map((listing) => this.map(listing, sellerId));
  }

  async update(
    sellerId: string,
    listingId: string,
    dto: UpdateMarketplaceListingDto,
  ): Promise<MarketplaceListingResponse> {
    const existing = await this.requireOwnedListing(sellerId, listingId);

    const nextIsFree = dto.isFree ?? existing.isFree;

    const nextPricePence =
      dto.pricePence !== undefined ? dto.pricePence : (existing.pricePence ?? undefined);

    this.validatePricing({
      isFree: nextIsFree,
      ...(nextPricePence !== undefined
        ? {
            pricePence: nextPricePence,
          }
        : {}),
    });

    if (dto.communityId !== undefined) {
      await this.requireCommunityMembership(sellerId, dto.communityId);
    }

    const mediaIds: string[] | undefined =
      dto.mediaIds === undefined ? undefined : [...new Set(dto.mediaIds)];

    if (mediaIds !== undefined && mediaIds.length !== dto.mediaIds?.length) {
      throw new BadRequestException('Duplicate media assets are not allowed.');
    }

    if (mediaIds !== undefined && mediaIds.length > 0) {
      await this.requireOwnedReadyMedia(sellerId, mediaIds);
    }

    const nextStatus = dto.status ?? existing.status;

    const data: Prisma.MarketplaceListingUncheckedUpdateInput = {};

    if (dto.title !== undefined) {
      data.title = dto.title.trim();
    }

    if (dto.description !== undefined) {
      data.description = dto.description.trim();
    }

    if (dto.category !== undefined) {
      data.category = dto.category;
    }

    if (dto.condition !== undefined) {
      data.condition = dto.condition;
    }

    if (dto.communityId !== undefined) {
      data.communityId = dto.communityId;
    }

    if (dto.isFree !== undefined) {
      data.isFree = dto.isFree;
    }

    if (dto.pricePence !== undefined || dto.isFree === true) {
      if (dto.isFree === true) {
        data.pricePence = null;
      } else if (dto.pricePence !== undefined) {
        data.pricePence = dto.pricePence;
      }
    }

    if (dto.acceptsOffers !== undefined) {
      data.acceptsOffers = dto.acceptsOffers;
    }

    if (dto.collectionAvailable !== undefined) {
      data.collectionAvailable = dto.collectionAvailable;
    }

    if (dto.deliveryAvailable !== undefined) {
      data.deliveryAvailable = dto.deliveryAvailable;
    }

    if (dto.postageAvailable !== undefined) {
      data.postageAvailable = dto.postageAvailable;
    }

    if (dto.localArea !== undefined) {
      data.localArea = dto.localArea.trim() || null;
    }

    if (dto.postcodeDistrict !== undefined) {
      data.postcodeDistrict = dto.postcodeDistrict.trim().toUpperCase() || null;
    }

    if (dto.latitude !== undefined) {
      data.latitude = dto.latitude;
    }

    if (dto.longitude !== undefined) {
      data.longitude = dto.longitude;
    }

    if (dto.status !== undefined) {
      data.status = dto.status;

      if (nextStatus === MarketplaceListingStatus.PUBLISHED) {
        data.publishedAt = existing.publishedAt ?? new Date();
      }

      if (nextStatus === MarketplaceListingStatus.RESERVED) {
        data.reservedAt = new Date();
      }

      if (nextStatus === MarketplaceListingStatus.SOLD) {
        data.soldAt = new Date();
      }

      if (nextStatus === MarketplaceListingStatus.ARCHIVED) {
        data.archivedAt = new Date();
      }
    }

    const listing = await this.database.$transaction(async (transaction) => {
      await transaction.marketplaceListing.update({
        where: {
          id: listingId,
        },
        data,
      });

      if (mediaIds !== undefined) {
        await transaction.marketplaceListingMedia.deleteMany({
          where: {
            listingId,
          },
        });

        if (mediaIds.length > 0) {
          await transaction.marketplaceListingMedia.createMany({
            data: mediaIds.map((mediaId, position) => ({
              listingId,
              mediaId,
              position,
            })),
          });
        }
      }

      return transaction.marketplaceListing.findUnique({
        where: {
          id: listingId,
        },
        include: listingInclude,
      });
    });

    if (!listing) {
      throw new NotFoundException('Marketplace listing not found.');
    }

    return this.map(listing, sellerId);
  }

  async toggleSaved(
    userId: string,
    listingId: string,
  ): Promise<{
    saved: boolean;
    savedCount: number;
  }> {
    await this.requirePublishedListing(listingId);

    const existing = await this.database.savedMarketplaceListing.findUnique({
      where: {
        userId_listingId: {
          userId,
          listingId,
        },
      },
    });

    if (existing) {
      await this.database.savedMarketplaceListing.delete({
        where: {
          id: existing.id,
        },
      });
    } else {
      await this.database.savedMarketplaceListing.create({
        data: {
          userId,
          listingId,
        },
      });
    }

    const savedCount = await this.database.savedMarketplaceListing.count({
      where: {
        listingId,
      },
    });

    return {
      saved: !existing,
      savedCount,
    };
  }

  async delete(sellerId: string, listingId: string): Promise<void> {
    await this.requireOwnedListing(sellerId, listingId);

    await this.database.marketplaceListing.update({
      where: {
        id: listingId,
      },
      data: {
        deletedAt: new Date(),
        status: MarketplaceListingStatus.ARCHIVED,
        archivedAt: new Date(),
      },
    });
  }

  private validatePricing(input: { isFree?: boolean; pricePence?: number }): void {
    if (input.isFree !== true && (input.pricePence === undefined || input.pricePence < 0)) {
      throw new BadRequestException('A valid price is required unless the listing is free.');
    }
  }

  private async requireCommunityMembership(userId: string, communityId: string): Promise<void> {
    const membership = await this.database.membership.findUnique({
      where: {
        userId_communityId: {
          userId,
          communityId,
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      throw new ForbiddenException('You must be an active member of the selected community.');
    }
  }

  private async requireOwnedReadyMedia(ownerId: string, mediaIds: string[]): Promise<void> {
    const count = await this.database.mediaAsset.count({
      where: {
        id: {
          in: mediaIds,
        },
        ownerId,
        status: 'READY',
        deletedAt: null,
      },
    });

    if (count !== mediaIds.length) {
      throw new ForbiddenException('One or more media assets are unavailable.');
    }
  }

  private async requireOwnedListing(sellerId: string, listingId: string) {
    const listing = await this.database.marketplaceListing.findFirst({
      where: {
        id: listingId,
        sellerId,
        deletedAt: null,
      },
    });

    if (!listing) {
      throw new NotFoundException('Marketplace listing not found.');
    }

    return listing;
  }

  private async requirePublishedListing(listingId: string): Promise<void> {
    const listing = await this.database.marketplaceListing.findFirst({
      where: {
        id: listingId,
        status: MarketplaceListingStatus.PUBLISHED,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!listing) {
      throw new NotFoundException('Marketplace listing not found.');
    }
  }

  private map(listing: ListingWithRelations, currentUserId: string): MarketplaceListingResponse {
    return {
      id: listing.id,
      title: listing.title,
      description: listing.description,
      category: listing.category,
      condition: listing.condition,
      status: listing.status,
      pricePence: listing.pricePence,
      isFree: listing.isFree,
      acceptsOffers: listing.acceptsOffers,
      collectionAvailable: listing.collectionAvailable,
      deliveryAvailable: listing.deliveryAvailable,
      postageAvailable: listing.postageAvailable,
      localArea: listing.localArea,
      postcodeDistrict: listing.postcodeDistrict,
      latitude: listing.latitude === null ? null : Number(listing.latitude),
      longitude: listing.longitude === null ? null : Number(listing.longitude),
      viewCount: listing.viewCount,
      seller: {
        id: listing.seller.id,
        displayName: listing.seller.displayName,
        username: listing.seller.profile?.username ?? null,
        avatarUrl: listing.seller.profile?.avatarUrl ?? null,
        localArea:
          listing.seller.profile?.showLocalArea === true ? listing.seller.profile.localArea : null,
      },
      community: listing.community
        ? {
            id: listing.community.id,
            name: listing.community.name,
            slug: listing.community.slug,
          }
        : null,
      media: listing.media.map((link) => ({
        id: link.id,
        position: link.position,
        altText: link.altText,
        asset: {
          id: link.media.id,
          url: link.media.publicUrl,
          fileName: link.media.fileName,
          mimeType: link.media.mimeType,
          width: link.media.width,
          height: link.media.height,
        },
      })),
      saved: listing.savedBy.some((save) => save.userId === currentUserId),
      savedCount: listing._count.savedBy,
      publishedAt: listing.publishedAt,
      reservedAt: listing.reservedAt,
      soldAt: listing.soldAt,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
    };
  }
}
