#!/bin/bash

set -e

echo "🚀 BUILD 0028 — Community Events & Services Engine"

cd services/api

mkdir -p src/community/event
mkdir -p src/community/attendance
mkdir -p src/community/services


# =====================================
# EVENT ENTITY
# =====================================

cat > src/community/event/event.entity.ts <<'TS'
export interface EventEntity {
  id: string;
  communityId: string;
  creatorId: string;
  title: string;
  description: string;
  startsAt: Date;
  endsAt: Date;
  createdAt: Date;
}
TS


# =====================================
# EVENT REPOSITORY
# =====================================

cat > src/community/event/event.repository.ts <<'TS'
import type { EventEntity } from './event.entity';

export abstract class EventRepository {

  abstract save(
    event: EventEntity,
  ): Promise<EventEntity>;

  abstract findById(
    id: string,
  ): Promise<EventEntity | undefined>;

  abstract findByCommunity(
    communityId: string,
  ): Promise<EventEntity[]>;

  abstract remove(
    id: string,
  ): Promise<void>;

}
TS


# =====================================
# EVENT SERVICE
# =====================================

cat > src/community/event/event.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { EventEntity } from './event.entity';

import { EventRepository } from './event.repository';


@Injectable()
export class EventService {

  constructor(
    private readonly repository: EventRepository,
  ) {}


  create(
    event: EventEntity,
  ): Promise<EventEntity> {
    return this.repository.save(event);
  }


  findCommunityEvents(
    communityId: string,
  ): Promise<EventEntity[]> {
    return this.repository.findByCommunity(
      communityId,
    );
  }


  findById(
    id: string,
  ): Promise<EventEntity | undefined> {
    return this.repository.findById(id);
  }


  remove(
    id: string,
  ): Promise<void> {
    return this.repository.remove(id);
  }

}
TS


# =====================================
# ATTENDANCE ENTITY
# =====================================

cat > src/community/attendance/attendance.entity.ts <<'TS'
export interface AttendanceEntity {
  id: string;
  eventId: string;
  userId: string;
  createdAt: Date;
}
TS


# =====================================
# ATTENDANCE REPOSITORY
# =====================================

cat > src/community/attendance/attendance.repository.ts <<'TS'
import type { AttendanceEntity } from './attendance.entity';

export abstract class AttendanceRepository {

  abstract save(
    attendance: AttendanceEntity,
  ): Promise<AttendanceEntity>;

  abstract remove(
    eventId: string,
    userId: string,
  ): Promise<void>;

  abstract findByEvent(
    eventId: string,
  ): Promise<AttendanceEntity[]>;

}
TS


# =====================================
# ATTENDANCE SERVICE
# =====================================

cat > src/community/attendance/attendance.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { AttendanceEntity } from './attendance.entity';

import { AttendanceRepository } from './attendance.repository';


@Injectable()
export class AttendanceService {

  constructor(
    private readonly repository: AttendanceRepository,
  ) {}


  join(
    attendance: AttendanceEntity,
  ): Promise<AttendanceEntity> {
    return this.repository.save(attendance);
  }


  leave(
    eventId: string,
    userId: string,
  ): Promise<void> {
    return this.repository.remove(
      eventId,
      userId,
    );
  }


  list(
    eventId: string,
  ): Promise<AttendanceEntity[]> {
    return this.repository.findByEvent(
      eventId,
    );
  }

}
TS


# =====================================
# COMMUNITY SERVICES
# =====================================

cat > src/community/services/community-service.entity.ts <<'TS'
export interface CommunityServiceEntity {
  id: string;
  communityId: string;
  title: string;
  description: string;
  createdAt: Date;
}
TS


cat > src/community/services/community-service.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { CommunityServiceEntity } from './community-service.entity';


@Injectable()
export class CommunityServiceService {

  private services:
    CommunityServiceEntity[] = [];


  create(
    service: CommunityServiceEntity,
  ): CommunityServiceEntity {

    this.services.push(service);

    return service;
  }


  list(
    communityId: string,
  ): CommunityServiceEntity[] {

    return this.services.filter(
      (service) =>
        service.communityId === communityId,
    );
  }

}
TS


# =====================================
# TEST
# =====================================

cat > test/community-event.service.test.ts <<'TS'
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { EventService } from '../src/community/event/event.service';


describe('EventService', () => {

  it('creates community events', async () => {

    const service =
      new EventService({
        save(event: unknown) {
          return Promise.resolve(event);
        },
      } as never);


    const result =
      await service.create({
        id: 'event-1',
        communityId: 'community-1',
        creatorId: 'user-1',
        title: 'Community Meeting',
        description: 'Local meeting',
        startsAt: new Date(),
        endsAt: new Date(),
        createdAt: new Date(),
      });


    assert.equal(
      result.title,
      'Community Meeting',
    );

  });

});
TS


cd ../..

pnpm exec prettier --write .
pnpm --filter @neighbour/api run lint
pnpm --filter @neighbour/api run test
pnpm --filter @neighbour/api run build

echo "🎉 BUILD 0028 COMPLETE"

