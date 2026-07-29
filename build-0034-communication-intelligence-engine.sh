#!/bin/bash

set -e

echo "🚀 BUILD 0034 — Communication Intelligence Engine"

cd services/api

mkdir -p src/communication/preferences
mkdir -p src/communication/rules
mkdir -p src/communication/intelligence
mkdir -p src/communication/events


# =====================================
# NOTIFICATION PREFERENCES
# =====================================

cat > src/communication/preferences/notification-preference.entity.ts <<'TS'
export interface NotificationPreferenceEntity {
  id: string;
  userId: string;
  category:
    | 'messages'
    | 'events'
    | 'community'
    | 'business';
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
TS


cat > src/communication/preferences/notification-preference.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { NotificationPreferenceEntity } from './notification-preference.entity';


@Injectable()
export class NotificationPreferenceService {

  private preferences:
    NotificationPreferenceEntity[] = [];


  save(
    preference: NotificationPreferenceEntity,
  ): NotificationPreferenceEntity {

    this.preferences.push(preference);

    return preference;
  }


  findForUser(
    userId: string,
  ): NotificationPreferenceEntity[] {

    return this.preferences.filter(
      (item) =>
        item.userId === userId,
    );
  }

}
TS


# =====================================
# NOTIFICATION RULES
# =====================================

cat > src/communication/rules/notification-rule.entity.ts <<'TS'
export interface NotificationRuleEntity {
  id: string;
  trigger: string;
  category: string;
  priority: 'low' | 'normal' | 'high';
  createdAt: Date;
}
TS


cat > src/communication/rules/notification-rule.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { NotificationRuleEntity } from './notification-rule.entity';


@Injectable()
export class NotificationRuleService {

  private rules:
    NotificationRuleEntity[] = [];


  create(
    rule: NotificationRuleEntity,
  ): NotificationRuleEntity {

    this.rules.push(rule);

    return rule;
  }


  findByTrigger(
    trigger: string,
  ): NotificationRuleEntity[] {

    return this.rules.filter(
      (rule) =>
        rule.trigger === trigger,
    );
  }

}
TS


# =====================================
# NOTIFICATION INTELLIGENCE
# =====================================

cat > src/communication/intelligence/notification-intelligence.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import { NotificationPreferenceService } from '../preferences/notification-preference.service';
import { NotificationRuleService } from '../rules/notification-rule.service';


@Injectable()
export class NotificationIntelligenceService {

  constructor(
    private readonly preferences:
      NotificationPreferenceService,

    private readonly rules:
      NotificationRuleService,
  ) {}


  shouldNotify(
    userId: string,
    trigger: string,
  ): boolean {

    const matchingRules =
      this.rules.findByTrigger(
        trigger,
      );

    if (!matchingRules.length) {
      return false;
    }


    const userPreferences =
      this.preferences.findForUser(
        userId,
      );


    return userPreferences.some(
      (item) =>
        item.enabled,
    );
  }

}
TS


# =====================================
# COMMUNICATION EVENTS
# =====================================

cat > src/communication/events/communication-event-bus.service.ts <<'TS'
import { Injectable } from '@nestjs/common';


export type CommunicationEvent =
  | {
      type: 'notification.created';
      notificationId: string;
    }
  | {
      type: 'notification.delivered';
      notificationId: string;
    };


@Injectable()
export class CommunicationEventBusService {

  private listeners:
    ((event: CommunicationEvent) => void)[] = [];


  subscribe(
    listener: (event: CommunicationEvent) => void,
  ) {

    this.listeners.push(listener);

  }


  publish(
    event: CommunicationEvent,
  ) {

    for (const listener of this.listeners) {
      listener(event);
    }

  }

}
TS


# =====================================
# TEST
# =====================================

mkdir -p test/communication

cat > test/communication/notification-preference.service.test.ts <<'TS'
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { NotificationPreferenceService } from '../../src/communication/preferences/notification-preference.service';


describe('NotificationPreferenceService', () => {

  it('stores user notification preferences', () => {

    const service =
      new NotificationPreferenceService();


    const result =
      service.save({
        id: 'pref-1',
        userId: 'user-1',
        category: 'events',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });


    assert.equal(
      result.enabled,
      true,
    );

  });

});
TS


cd ../..

pnpm exec prettier --write .
pnpm --filter @neighbour/api run lint
pnpm --filter @neighbour/api run test
pnpm --filter @neighbour/api run build

echo "🎉 BUILD 0034 COMPLETE"

