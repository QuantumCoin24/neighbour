import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';

import type { AttendanceEntity } from './attendance.entity';
import { AttendanceRepository } from './attendance.repository';

@Injectable()
export class PrismaAttendanceRepository extends AttendanceRepository {
  constructor(private readonly database: DatabaseService) {
    super();
  }

  private map(attendance: any): AttendanceEntity {
    return {
      id: attendance.id,
      eventId: attendance.eventId,
      userId: attendance.userId,
      createdAt: attendance.createdAt,
    };
  }

  async save(attendance: AttendanceEntity): Promise<AttendanceEntity> {
    const record = await this.database.attendance.create({
      data: {
        id: attendance.id,
        eventId: attendance.eventId,
        userId: attendance.userId,
      },
    });

    return this.map(record);
  }

  async remove(eventId: string, userId: string): Promise<void> {
    await this.database.attendance.delete({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });
  }

  async findByEvent(eventId: string): Promise<AttendanceEntity[]> {
    const records = await this.database.attendance.findMany({
      where: {
        eventId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return records.map((record) => this.map(record));
  }
}
