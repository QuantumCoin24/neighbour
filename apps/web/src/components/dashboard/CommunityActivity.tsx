'use client';

import { NeighbourBadge, NeighbourCard } from '@neighbour/design-system';

interface Props {
  memberCount: number | null;

  postCount: number;

  eventCount: number;

  conversationCount: number;
}

export default function CommunityActivity({
  memberCount,

  postCount,

  eventCount,

  conversationCount,
}: Props) {
  const score = Math.min(
    100,
    postCount * 20 + eventCount * 20 + conversationCount * 10 + (memberCount ? 20 : 0),
  );

  let status = 'Quiet';

  let description = 'Your community is waiting for new activity.';

  if (score >= 70) {
    status = 'Thriving';

    description = 'Your neighbourhood is highly active today.';
  } else if (score >= 30) {
    status = 'Active';

    description = 'Neighbours are connecting and sharing.';
  }

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
        🔥 Community Pulse
      </h2>

      <h3
        style={{
          marginTop: '16px',
          fontSize: '28px',
        }}
      >
        {status}
      </h3>

      <div
        style={{
          height: '12px',

          background: '#E5E7EB',

          borderRadius: '999px',

          overflow: 'hidden',

          marginTop: '16px',
        }}
      >
        <div
          style={{
            width: `${score}%`,

            height: '100%',

            background: '#D6A84F',

            borderRadius: '999px',
          }}
        />
      </div>

      <p
        style={{
          marginTop: '12px',
          color: '#667085',
        }}
      >
        Activity score: {score}/100
      </p>

      <div
        style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          marginTop: '20px',
        }}
      >
        <NeighbourBadge>📝 {postCount} Posts</NeighbourBadge>

        <NeighbourBadge>📅 {eventCount} Events</NeighbourBadge>

        <NeighbourBadge>💬 {conversationCount} Conversations</NeighbourBadge>
      </div>

      <p
        style={{
          marginTop: '20px',
          color: '#667085',
        }}
      >
        {description}
      </p>
    </NeighbourCard>
  );
}
