import { Injectable } from '@nestjs/common';

import { BuildVerificationService } from './build-verification.service';
import { LaunchReadinessService } from './launch-readiness.service';
import { ReleaseVerificationService } from './release-verification.service';

import { ActivationAuditService } from '../audit/activation/activation-audit.service';

@Injectable()
export class PlatformReleaseService {
  constructor(
    private readonly build: BuildVerificationService,

    private readonly launch: LaunchReadinessService,

    private readonly verification: ReleaseVerificationService,

    private readonly audit: ActivationAuditService,
  ) {}

  evaluate() {
    const build = this.build.check('PASS');

    const launch = this.launch.check('READY');

    const release = this.verification.verify({
      build: 'PASS',

      tests: 'PASS',

      verification: 'PASS',

      launch: 'READY',

      status: 'READY',
    });

    const audit = this.audit.analyse({
      domain: 'platform',

      status: 'ACTIVE',

      service: true,

      module: true,

      controller: true,

      database: true,
    });

    return {
      status: build.passed && launch.ready && release.verified ? 'READY' : 'REVIEW_REQUIRED',

      build,

      launch,

      release,

      audit,
    };
  }
}
