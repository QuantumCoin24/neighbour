'use client';

import { useEffect, useState } from 'react';

import { getNotifications, type Notification } from '@neighbour/api-client';

import { NeighbourBadge, NeighbourCard, NeighbourButton } from '@neighbour/design-system';

interface Props {
  token: string;
}

export default function NotificationPreview({ token }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const response = await getNotifications(token);

        setNotifications(response.items.slice(0, 3));
      } catch {
        setNotifications([]);
      }
    }

    load();
  }, [token]);

  return (
    <NeighbourCard
      style={{
        marginTop: 0,
        padding: '18px',
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: '18px',
        }}
      >
        🔔 Notifications
      </h2>

      <p
        style={{
          marginTop: '8px',
          color: '#667085',
        }}
      >
        Recent neighbourhood activity.
      </p>

      {notifications.length === 0 ? (
        <div
          style={{
            marginTop: '14px',
            padding: '14px',
            background: '#F7F9FC',
            borderRadius: '16px',
          }}
        >
          <p>No new notifications.</p>

          <p
            style={{
              color: '#667085',
            }}
          >
            Updates from your community will appear here.
          </p>
        </div>
      ) : (
        notifications.map((notification) => (
          <div
            key={notification.id}

            style={{
              marginTop: '12px',

              padding: '12px',

              background: '#F7F9FC',

              borderRadius: '18px',
            }}
          >
            <NeighbourBadge>🔔 {notification.type}</NeighbourBadge>

            <p
              style={{
                marginTop: '12px',
              }}
            >
              {notification.actor
                ? `${notification.actor.displayName} interacted with your neighbourhood`
                : 'Neighbour update'}
            </p>
          </div>
        ))
      )}

      <div
        style={{
          marginTop: '14px',
        }}
      >
        <NeighbourButton>View Notifications</NeighbourButton>
      </div>
    </NeighbourCard>
  );
}
