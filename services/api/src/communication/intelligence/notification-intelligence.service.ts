import { Injectable } from '@nestjs/common';

import { NotificationPreferenceService } from '../preferences/notification-preference.service';
import { NotificationRuleService } from '../rules/notification-rule.service';

@Injectable()
export class NotificationIntelligenceService {
  constructor(
    private readonly preferences: NotificationPreferenceService,

    private readonly rules: NotificationRuleService,
  ) {}

  shouldNotify(userId: string, trigger: string): boolean {
    const matchingRules = this.rules.findByTrigger(trigger);

    if (!matchingRules.length) {
      return false;
    }

    const userPreferences = this.preferences.findForUser(userId);

    return userPreferences.some((item) => item.enabled);
  }
}
