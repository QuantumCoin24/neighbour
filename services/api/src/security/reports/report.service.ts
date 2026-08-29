import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';
import { SecurityEventBusService } from '../events/security-event-bus.service';

import { CreateReportDto } from './dto/create-report.dto';
import type { ReportResponse } from './interfaces/report-response.interface';

@Injectable()
export class ReportService {
  constructor(
    private readonly database: DatabaseService,
    private readonly securityEvents: SecurityEventBusService,
  ) {}

  private map(report: any): ReportResponse {
    return {
      id: report.id,
      reporterId: report.reporterId,
      targetType: report.targetType,
      targetId: report.targetId,
      reason: report.reason,
      description: report.description,
      status: report.status,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    };
  }

  async create(userId: string, dto: CreateReportDto): Promise<ReportResponse> {
    if (dto.targetType === 'MARKETPLACE_LISTING') {
      const listing = await this.database.marketplaceListing.findFirst({
        where: {
          id: dto.targetId,
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

    if (dto.targetType === 'MAP_DISCOVERY') {
      const discovery = await this.database.mapDiscovery.findFirst({
        where: {
          id: dto.targetId,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

      if (!discovery) {
        throw new NotFoundException('Map discovery not found.');
      }
    }

    const existing = await this.database.report.findFirst({
      where: {
        reporterId: userId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        status: {
          in: ['PENDING', 'UNDER_REVIEW'],
        },
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      throw new ConflictException('You have already submitted an active report for this item.');
    }

    const report = await this.database.report.create({
      data: {
        reporterId: userId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        reason: dto.reason,
        description: dto.description ?? null,
      },
    });

    this.securityEvents.publish({
      type: 'report.created',
      subjectId: report.id,
    });

    return this.map(report);
  }

  async findMine(userId: string): Promise<ReportResponse[]> {
    const reports = await this.database.report.findMany({
      where: {
        reporterId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return reports.map((report) => this.map(report));
  }
}
