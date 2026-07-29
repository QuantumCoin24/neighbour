import { Injectable } from '@nestjs/common';

import type { AttendanceEntity } from './attendance.entity';

import { AttendanceRepository } from './attendance.repository';

@Injectable()
export class AttendanceService {
  constructor(private readonly repository: AttendanceRepository) {}

  join(attendance: AttendanceEntity): Promise<AttendanceEntity> {
    return this.repository.save(attendance);
  }

  leave(eventId: string, userId: string): Promise<void> {
    return this.repository.remove(eventId, userId);
  }

  list(eventId: string): Promise<AttendanceEntity[]> {
    return this.repository.findByEvent(eventId);
  }
}
