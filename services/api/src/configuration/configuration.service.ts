import { Injectable } from '@nestjs/common';

import type { FeatureFlagEntity } from './feature-flag.entity';

@Injectable()
export class ConfigurationService {
  private flags: FeatureFlagEntity[] = [];

  create(flag: FeatureFlagEntity): FeatureFlagEntity {
    this.flags.push(flag);

    return flag;
  }

  enabled(name: string): boolean {
    return this.flags.some((flag) => flag.name === name && flag.enabled);
  }
}
