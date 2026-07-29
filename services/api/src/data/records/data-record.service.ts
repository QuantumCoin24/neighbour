import { Injectable } from '@nestjs/common';

import type { DataRecordEntity } from './data-record.entity';

@Injectable()
export class DataRecordService {
  private records: DataRecordEntity[] = [];

  create(record: DataRecordEntity): DataRecordEntity {
    this.records.push(record);

    return record;
  }

  findByOwner(ownerId: string): DataRecordEntity[] {
    return this.records.filter((item) => item.ownerId === ownerId);
  }
}
