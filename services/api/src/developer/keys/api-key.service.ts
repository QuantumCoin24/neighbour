import { Injectable } from '@nestjs/common';

import type { ApiKeyEntity } from './api-key.entity';


@Injectable()
export class ApiKeyService {

  private keys:
    ApiKeyEntity[] = [];


  create(
    apiKey: ApiKeyEntity,
  ): ApiKeyEntity {

    this.keys.push(apiKey);

    return apiKey;
  }


  findByApp(
    appId: string,
  ): ApiKeyEntity[] {

    return this.keys.filter(
      (item) =>
        item.appId === appId,
    );
  }

}
