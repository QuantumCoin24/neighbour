'use client';

import { useRouter } from 'next/navigation';

import { NeighbourBadge, NeighbourButton, NeighbourCard } from '@neighbour/design-system';

interface Props {
  neighbourhoodName: string | null;

  communityName: string | null;
}

export default function CommunityIdentity({
  neighbourhoodName,

  communityName,
}: Props) {
  const router = useRouter();

  return (
    <NeighbourCard
      style={{
        marginTop: '24px',

        background: 'linear-gradient(135deg,#FFFFFF,#F7F9FC)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '20px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: '24px',
            }}
          >
            🏘️ Your Neighbourhood
          </h2>

          <h3
            style={{
              marginTop: '16px',
              marginBottom: '8px',
              fontSize: '22px',
            }}
          >
            {neighbourhoodName ?? 'Discover your area'}
          </h3>

          <p
            style={{
              color: '#667085',
              fontSize: '16px',
            }}
          >
            {communityName ? `${communityName} community` : 'Join your local community'}
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          <NeighbourBadge>📍 Local Area</NeighbourBadge>

          <NeighbourBadge>🤝 Connected</NeighbourBadge>
        </div>
      </div>

      <p
        style={{
          marginTop: '20px',
          color: '#667085',
          lineHeight: 1.6,
        }}
      >
        Discover neighbours, local conversations, events and community activity in one place.
      </p>

      <div
        style={{
          marginTop: '20px',
        }}
      >
        <NeighbourButton onClick={() => router.push('/community')}>
          Explore Community
        </NeighbourButton>
      </div>
    </NeighbourCard>
  );
}
