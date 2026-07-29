import { Injectable } from '@nestjs/common';

import type { NotificationRuleEntity } from './notification-rule.entity';

@Injectable()
export class NotificationRuleService {
  private rules: NotificationRuleEntity[] = [];

  create(rule: NotificationRuleEntity): NotificationRuleEntity {
    this.rules.push(rule);

    return rule;
  }

  findByTrigger(trigger: string): NotificationRuleEntity[] {
    return this.rules.filter((rule) => rule.trigger === trigger);
  }
}
