'use client';

import { useEffect, useState } from 'react';

import { getModerationStats, type ModerationStats as Stats } from '@neighbour/api-client';

import { NeighbourBadge, NeighbourCard } from '@neighbour/design-system';

interface Props {
  token: string;
}

export default function ModerationStats({ token }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const result = await getModerationStats(token);

        setStats(result);
      } catch {
        setStats(null);
      }
    }

    load();
  }, [token]);

  if (!stats) {
    return null;
  }

  return (
    <NeighbourCard
      style={{
        marginBottom: '24px',
      }}
    >
      <h2>🛡️ Safety Overview</h2>

      <div
        style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          marginTop: '16px',
        }}
      >
        <NeighbourBadge>🚩 Pending {stats.pending}</NeighbourBadge>

        <NeighbourBadge>🔎 Under Review {stats.underReview}</NeighbourBadge>

        <NeighbourBadge>✅ Resolved {stats.resolved}</NeighbourBadge>

        <NeighbourBadge>❌ Dismissed {stats.dismissed}</NeighbourBadge>
      </div>
    </NeighbourCard>
  );
}
