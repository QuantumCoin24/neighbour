#!/bin/bash

set -e

echo "🚀 BUILD 0026 — Neighbourhood Completion"

cd services/api


mkdir -p src/neighbourhood/discovery
mkdir -p src/neighbourhood/events


# =====================================
# Discovery Response
# =====================================

cat > src/neighbourhood/discovery/neighbourhood-discovery.response.ts <<'TS'
export interface NeighbourhoodDiscoveryResponse {
  id: string;
  name: string;
  description: string;
  localArea: string | null;
}
TS


# =====================================
# Discovery Service
# =====================================

cat > src/neighbourhood/discovery/neighbourhood-discovery.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { NeighbourhoodEntity } from '../neighbourhood.entity';
import type { NeighbourhoodDiscoveryResponse } from './neighbourhood-discovery.response';

import { NeighbourhoodRepository } from '../neighbourhood.repository';


@Injectable()
export class NeighbourhoodDiscoveryService {

  constructor(
    private readonly repository: NeighbourhoodRepository,
  ) {}

  async search(): Promise<NeighbourhoodDiscoveryResponse[]> {

    const neighbourhoods =
      await this.repository.findAll();

    return neighbourhoods.map(
      (item) => this.map(item),
    );
  }


  private map(
    item: NeighbourhoodEntity,
  ): NeighbourhoodDiscoveryResponse {

    return {
      id: item.id,
      name: item.name,
      description: item.description,
      localArea: item.localArea,
    };
  }
}
TS


# =====================================
# Event Bus
# =====================================

cat > src/neighbourhood/events/neighbourhood-event-bus.service.ts <<'TS'
import { Injectable } from '@nestjs/common';


export type NeighbourhoodEvent =
  | {
      type: 'neighbourhood.created';
      neighbourhoodId: string;
    }
  | {
      type: 'member.joined';
      userId: string;
      neighbourhoodId: string;
    }
  | {
      type: 'member.left';
      userId: string;
      neighbourhoodId: string;
    };


export type NeighbourhoodEventHandler =
  (event: NeighbourhoodEvent) => void;


@Injectable()
export class NeighbourhoodEventBusService {

  private handlers:
    NeighbourhoodEventHandler[] = [];


  subscribe(
    handler: NeighbourhoodEventHandler,
  ): () => void {

    this.handlers.push(handler);

    return () => {
      this.handlers =
        this.handlers.filter(
          (item) => item !== handler,
        );
    };
  }


  publish(
    event: NeighbourhoodEvent,
  ): void {

    for (const handler of this.handlers) {
      handler(event);
    }
  }
}
TS


# =====================================
# User Neighbourhood Context
# =====================================

cat > src/neighbourhood/neighbourhood-context.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import { MembershipRepository } from './membership/membership.repository';


@Injectable()
export class NeighbourhoodContextService {

  constructor(
    private readonly repository: MembershipRepository,
  ) {}


  getUserNeighbourhoods(
    userId: string,
  ) {

    return this.repository.findByUser(userId);
  }
}
TS


cd ../..

pnpm exec prettier --write .
pnpm --filter @neighbour/api run lint
pnpm --filter @neighbour/api run test
pnpm --filter @neighbour/api run build


echo "🎉 BUILD 0026 COMPLETE"

