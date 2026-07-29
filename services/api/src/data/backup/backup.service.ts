import { Injectable } from '@nestjs/common';

import type { BackupEntity } from './backup.entity';

@Injectable()
export class BackupService {
  private backups: BackupEntity[] = [];

  create(backup: BackupEntity): BackupEntity {
    this.backups.push(backup);

    return backup;
  }

  list(): BackupEntity[] {
    return this.backups;
  }
}
