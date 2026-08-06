import { Injectable } from '@nestjs/common';

import { ReportStatus } from '../../generated/prisma/client.js';

import { DatabaseService } from '../../database/database.service';

import { UpdateReportStatusDto } from './dto/update-report-status.dto';

@Injectable()
export class ModerationService {
  constructor(private readonly database: DatabaseService) {}

  async findReports(filters: { status?: string; targetType?: string; search?: string }) {
    return this.database.report.findMany({
      include: {
        reporter: {
          select: {
            id: true,
            displayName: true,
            email: true,
            role: true,
          },
        },

        actions: {
          include: {
            moderator: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findPendingReports() {
    return this.database.report.findMany({
      where: {
        status: ReportStatus.PENDING,
      },

      include: {
        reporter: {
          select: {
            id: true,
            displayName: true,
            email: true,
            role: true,
          },
        },

        actions: {
          include: {
            moderator: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  private async resolveTarget(type: string, id: string) {
    switch (type) {
      case 'POST':
        return this.database.post.findUnique({
          where: { id },
          include: {
            author: {
              select: {
                id: true,
                displayName: true,
              },
            },
            community: {
              select: {
                name: true,
              },
            },
          },
        });

      case 'MESSAGE':
        return this.database.message.findUnique({
          where: { id },
          include: {
            sender: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        });

      case 'EVENT':
        return this.database.event.findUnique({
          where: { id },
          include: {
            creator: {
              select: {
                id: true,
                displayName: true,
              },
            },
            community: {
              select: {
                name: true,
              },
            },
          },
        });

      case 'MARKETPLACE_LISTING':
        return this.database.marketplaceListing.findUnique({
          where: {
            id,
          },
          include: {
            seller: {
              select: {
                id: true,
                displayName: true,
              },
            },
            community: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            media: {
              include: {
                media: true,
              },
              orderBy: {
                position: 'asc',
              },
            },
          },
        });

      case 'USER':
        return this.database.user.findUnique({
          where: { id },
          include: {
            profile: true,
          },
        });
    }

    return null;
  }

  async findReport(reportId: string) {
    const report = await this.database.report.findUnique({
      where: {
        id: reportId,
      },

      include: {
        reporter: {
          select: {
            id: true,
            displayName: true,
            email: true,
            role: true,
          },
        },

        actions: {
          include: {
            moderator: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    if (!report) {
      return null;
    }

    const evidence = await this.resolveTarget(report.targetType, report.targetId);

    return {
      ...report,
      evidence,
    };
  }

  async updateStatus(reportId: string, moderatorId: string, dto: UpdateReportStatusDto) {
    const report = await this.database.report.update({
      where: {
        id: reportId,
      },

      data: {
        status: dto.status,
      },
    });

    await this.database.moderationAction.create({
      data: {
        reportId,

        moderatorId,

        action: dto.status,

        notes: dto.notes ?? null,
      },
    });

    return report;
  }
}
