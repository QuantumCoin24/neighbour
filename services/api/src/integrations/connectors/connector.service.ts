import { Injectable } from '@nestjs/common';

import type { ConnectorEntity } from './connector.entity';


@Injectable()
export class ConnectorService {

  private connectors:
    ConnectorEntity[] = [];


  create(
    connector: ConnectorEntity,
  ): ConnectorEntity {

    this.connectors.push(
      connector,
    );

    return connector;
  }


  findByIntegration(
    integrationId: string,
  ): ConnectorEntity[] {

    return this.connectors.filter(
      (item) =>
        item.integrationId === integrationId,
    );
  }

}
