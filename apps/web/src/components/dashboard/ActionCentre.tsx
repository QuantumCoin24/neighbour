'use client';

import Link from 'next/link';

import { NeighbourCard } from '@neighbour/design-system';

const actions = [
  {
    label: '📝 Create Post',
    href: '/community',
  },

  {
    label: '👥 Find Neighbours',
    href: '/search',
  },

  {
    label: '🏘️ Explore Community',
    href: '/community',
  },

  {
    label: '📅 Events',
    href: '/community',
  },

  {
    label: '🛡️ Report Safety',
    href: '/notifications',
  },
];

export default function ActionCentre() {
  return (
    <NeighbourCard
      style={{
        marginTop: '24px',
      }}
    >
      <h2>Quick Actions</h2>

      <div
        style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          marginTop: '16px',
        }}
      >
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            style={{
              padding: '12px 20px',
              borderRadius: '999px',
              background: '#D6A84F',
              color: '#08111F',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            {action.label}
          </Link>
        ))}
      </div>
    </NeighbourCard>
  );
}
