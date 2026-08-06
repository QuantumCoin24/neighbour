import assert from 'node:assert/strict';
import test from 'node:test';

import { MarketplaceModerationRiskScoreService } from '../../../src/marketplace/moderation/scoring/marketplace-moderation-risk-score.service';

test('ModerationOS produces bounded risk scores', () => {
  const service = new MarketplaceModerationRiskScoreService();

  const result = service.calculate({
    fraudSignalWeight: 250,
    activeDisputes: 2,
    confirmedDisputes: 1,
    cancellationRate: 0.2,
    refundRate: 0.1,
    reportCount: 3,
    identityVerified: false,
    accountAgeDays: 5,
    previousWarnings: 1,
    previousSuspensions: 0,
  });

  assert.ok(result.riskScore >= 0);
  assert.ok(result.riskScore <= 1_000);
  assert.ok(result.fraudScore >= 0);
  assert.ok(result.fraudScore <= 1_000);
  assert.equal(result.requiresManualReview, true);
});

test('severe fraud creates a critical priority', () => {
  const service = new MarketplaceModerationRiskScoreService();

  const result = service.calculate({
    fraudSignalWeight: 900,
    activeDisputes: 5,
    confirmedDisputes: 3,
    cancellationRate: 0.8,
    refundRate: 0.7,
    reportCount: 10,
    identityVerified: false,
    accountAgeDays: 1,
    previousWarnings: 5,
    previousSuspensions: 2,
  });

  assert.equal(result.priority, 'CRITICAL');
});
