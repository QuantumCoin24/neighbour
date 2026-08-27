'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { getConversations, type Conversation } from '@neighbour/api-client';

import {
  NeighbourAvatar,
  NeighbourBadge,
  NeighbourCard,
  NeighbourButton,
} from '@neighbour/design-system';

interface Props {
  token: string;
}

export default function MessagePreview({ token }: Props) {
  const router = useRouter();

  const [messages, setMessages] = useState<Conversation[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const response = await getConversations(token);

        setMessages(response.items.slice(0, 3));
      } catch {
        setMessages([]);
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
        💬 Messages
      </h2>

      <p
        style={{
          marginTop: '8px',
          color: '#667085',
        }}
      >
        Recent conversations with neighbours.
      </p>

      {messages.length === 0 ? (
        <div
          style={{
            marginTop: '14px',
            padding: '14px',
            background: '#F7F9FC',
            borderRadius: '16px',
          }}
        >
          <p>No conversations yet.</p>

          <p
            style={{
              color: '#667085',
            }}
          >
            Start connecting with your community.
          </p>
        </div>
      ) : (
        messages.map((conversation) => (
          <div
            key={conversation.id}

            style={{
              display: 'flex',

              gap: '16px',

              alignItems: 'center',

              marginTop: '12px',

              padding: '12px',

              background: '#F7F9FC',

              borderRadius: '18px',
            }}
          >
            <NeighbourAvatar name={conversation.title ?? 'Neighbour'} />

            <div
              style={{
                flex: 1,
              }}
            >
              <h3
                style={{
                  margin: 0,
                }}
              >
                {conversation.title ?? 'Conversation'}
              </h3>

              <NeighbourBadge>💬 Active Chat</NeighbourBadge>

              {conversation.lastMessage && (
                <p
                  style={{
                    marginTop: '8px',
                    color: '#667085',
                  }}
                >
                  {conversation.lastMessage.content}
                </p>
              )}
            </div>
          </div>
        ))
      )}

      <div
        style={{
          marginTop: '14px',
        }}
      >
        <NeighbourButton onClick={() => router.push('/messages')}>View Messages</NeighbourButton>
      </div>
    </NeighbourCard>
  );
}
