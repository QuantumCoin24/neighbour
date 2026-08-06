import assert from 'node:assert/strict';
import test from 'node:test';

import { MarketplaceReputationScoreService } from '../../../src/marketplace/reputation/scoring/marketplace-reputation-score.service';

test('ReputationOS produces a bounded score', () => {
  const service = new MarketplaceReputationScoreService();

  const result = service.calculate({
    metrics: {
      completedTransactions: 20,
      successfulPurchases: 10,
      successfulSales: 10,
      cancelledTransactions: 1,
      disputedTransactions: 0,
      verifiedReviews: 16,
      positiveReviews: 15,
      neutralReviews: 1,
      negativeReviews: 0,
      averageRating: 4.8,
      completionRate: 0.95,
      cancellationRate: 0.05,
      disputeRate: 0,
      responseRate: 0.9,
      averageResponseMinutes: 15,
    },
    identityVerified: true,
    accountAgeDays: 365,
    activeReports: 0,
    confirmedFraudSignals: 0,
  });

  assert.ok(result.score >= 0);
  assert.ok(result.score <= 1_000);
  assert.ok(result.riskScore >= 0);
  assert.ok(result.riskScore <= 1_000);
});

test('confirmed fraud signals reduce reputation', () => {
  const service = new MarketplaceReputationScoreService();

  const clean = service.calculate({
    metrics: {
      completedTransactions: 10,
      successfulPurchases: 5,
      successfulSales: 5,
      cancelledTransactions: 0,
      disputedTransactions: 0,
      verifiedReviews: 8,
      positiveReviews: 8,
      neutralReviews: 0,
      negativeReviews: 0,
      averageRating: 5,
      completionRate: 1,
      cancellationRate: 0,
      disputeRate: 0,
      responseRate: 1,
      averageResponseMinutes: 5,
    },
    identityVerified: true,
    accountAgeDays: 365,
    activeReports: 0,
    confirmedFraudSignals: 0,
  });

  const risky = service.calculate({
    metrics: {
      completedTransactions: 10,
      successfulPurchases: 5,
      successfulSales: 5,
      cancelledTransactions: 0,
      disputedTransactions: 0,
      verifiedReviews: 8,
      positiveReviews: 8,
      neutralReviews: 0,
      negativeReviews: 0,
      averageRating: 5,
      completionRate: 1,
      cancellationRate: 0,
      disputeRate: 0,
      responseRate: 1,
      averageResponseMinutes: 5,
    },
    identityVerified: true,
    accountAgeDays: 365,
    activeReports: 0,
    confirmedFraudSignals: 2,
  });

  assert.ok(risky.score < clean.score);

  assert.ok(risky.riskScore > clean.riskScore);
});
