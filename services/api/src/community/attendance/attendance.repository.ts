import type { AttendanceEntity } from './attendance.entity';

export abstract class AttendanceRepository {
  abstract save(attendance: AttendanceEntity): Promise<AttendanceEntity>;

  abstract remove(eventId: string, userId: string): Promise<void>;

  abstract findByEvent(eventId: string): Promise<AttendanceEntity[]>;
}
