import { Injectable } from '@nestjs/common';

import type { StorageEntity } from './storage.entity';

@Injectable()
export class StorageService {
  private storage: StorageEntity[] = [];

  save(item: StorageEntity): StorageEntity {
    this.storage.push(item);

    return item;
  }

  find(assetId: string): StorageEntity | undefined {
    return this.storage.find((item) => item.assetId === assetId);
  }
}
