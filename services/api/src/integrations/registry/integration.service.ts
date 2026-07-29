import { Injectable } from '@nestjs/common';

import type { IntegrationEntity } from './integration.entity';


@Injectable()
export class IntegrationService {

  private integrations:
    IntegrationEntity[] = [];


  register(
    integration: IntegrationEntity,
  ): IntegrationEntity {

    this.integrations.push(
      integration,
    );

    return integration;
  }


  findAll(): IntegrationEntity[] {
    return this.integrations;
  }


  findByName(
    name: string,
  ): IntegrationEntity | undefined {

    return this.integrations.find(
      (item) =>
        item.name === name,
    );
  }

}
