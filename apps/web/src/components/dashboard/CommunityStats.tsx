'use client';

import { NeighbourBadge, NeighbourCard } from '@neighbour/design-system';

interface Props {
  communityName: string | null;

  memberCount: number | null;
}

export default function CommunityStats({
  communityName,

  memberCount,
}: Props) {
  const count = memberCount ?? 0;

  const activityLabel = count > 50 ? 'Active Network' : 'Growing Network';

  return (
    <NeighbourCard
      style={{
        marginTop: '24px',

        background: 'linear-gradient(135deg,#FFFFFF,#F7F9FC)',
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: '24px',
        }}
      >
        📊 Community Snapshot
      </h2>

      <h3
        style={{
          marginTop: '16px',
          fontSize: '22px',
        }}
      >
        {communityName ?? 'Your Community'}
      </h3>

      <p
        style={{
          color: '#667085',
          marginTop: '8px',
        }}
      >
        Your local connection at a glance.
      </p>

      <div
        style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          marginTop: '20px',
        }}
      >
        <NeighbourBadge>👥 {count} Neighbours</NeighbourBadge>

        <NeighbourBadge>🟢 {activityLabel}</NeighbourBadge>

        <NeighbourBadge>🏘️ Connected Local Hub</NeighbourBadge>
      </div>
    </NeighbourCard>
  );
}
