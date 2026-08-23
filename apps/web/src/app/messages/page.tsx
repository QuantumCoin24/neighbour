'use client';

import Link from 'next/link';

import { useEffect, useMemo, useState } from 'react';

import { getConversations, type Conversation } from '@neighbour/api-client';

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function formatTime(value: string | null) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  const now = new Date();

  const sameDay = date.toDateString() === now.toDateString();

  if (sameDay) {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return date.toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
  });
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const [query, setQuery] = useState('');

  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState('');

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        setMessage('Please sign in first.');
        setLoading(false);
        return;
      }

      try {
        const result = await getConversations(token, {
          limit: 100,
        });

        setConversations(result.items);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Unable to load conversations.');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      const memberNames = conversation.members.map((member) => member.user.displayName).join(' ');

      const haystack = [
        conversation.title,
        conversation.lastMessage?.content,
        memberNames,
        conversation.type,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }, [conversations, query]);

  return (
    <main className="messages-page">
      <header className="messages-header">
        <div>
          <div className="messages-eyebrow">YOUR CONVERSATIONS</div>

          <h1>Messages</h1>

          <p>Private conversations with neighbours and people in your local network.</p>
        </div>

        <div className="messages-count">
          <strong>{conversations.length}</strong>

          <span>{conversations.length === 1 ? 'conversation' : 'conversations'}</span>
        </div>
      </header>

      <section className="messages-shell">
        <aside className="messages-list-panel">
          <div className="messages-search">
            <span>⌕</span>

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search conversations"
            />
          </div>

          <div className="messages-list-heading">
            <strong>Inbox</strong>

            <span>{filtered.length}</span>
          </div>

          {loading ? (
            <div className="messages-state">Loading conversations…</div>
          ) : message ? (
            <div className="messages-state">{message}</div>
          ) : filtered.length === 0 ? (
            <div className="messages-empty">
              <div>□</div>

              <strong>No conversations found</strong>

              <p>Your neighbour conversations will appear here.</p>
            </div>
          ) : (
            <div className="messages-list">
              {filtered.map((conversation) => {
                const label =
                  conversation.title ||
                  conversation.members
                    .map((member) => member.user.displayName)
                    .slice(0, 3)
                    .join(', ') ||
                  'Conversation';

                const latest = conversation.lastMessage?.content || 'No messages yet';

                return (
                  <Link
                    key={conversation.id}
                    href={`/messages/${conversation.id}`}
                    className="conversation-row"
                  >
                    <div className="conversation-avatar">{initials(label) || 'N'}</div>

                    <div className="conversation-copy">
                      <div className="conversation-title-line">
                        <strong>{label}</strong>

                        <span>{formatTime(conversation.lastMessageAt)}</span>
                      </div>

                      <p>{latest}</p>

                      <div className="conversation-meta">
                        <span>
                          {conversation.members.length}{' '}
                          {conversation.members.length === 1 ? 'member' : 'members'}
                        </span>

                        <span>{conversation.type}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </aside>

        <section className="messages-welcome">
          <div className="messages-welcome-mark">N</div>

          <div className="messages-welcome-eyebrow">NEIGHBOUR™ MESSAGING</div>

          <h2>Your local conversations, together.</h2>

          <p>Select a conversation from your inbox to continue talking with neighbours.</p>

          <div className="messages-feature-grid">
            <div>
              <span>□</span>
              <strong>Private conversations</strong>
            </div>

            <div>
              <span>⌂</span>
              <strong>Local connections</strong>
            </div>

            <div>
              <span>◇</span>
              <strong>Built-in safety tools</strong>
            </div>
          </div>
        </section>
      </section>

      <style>{`
        .messages-page {
          width: min(100% - 48px, 1420px);
          margin: 0 auto;
          padding: 42px 0 90px;
          box-sizing: border-box;
        }

        .messages-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 24px;
          margin-bottom: 26px;
        }

        .messages-eyebrow {
          margin-bottom: 8px;
          color: #0a6945;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: .15em;
        }

        .messages-header h1 {
          margin: 0;
          color: #102019;
          font-size: clamp(32px,4vw,48px);
          letter-spacing: -.045em;
        }

        .messages-header p {
          max-width: 620px;
          margin: 9px 0 0;
          color: #75827c;
          font-size: 14px;
        }

        .messages-count {
          min-width: 110px;
          padding: 12px 15px;
          border: 1px solid #dce4df;
          border-radius: 14px;
          background: #fff;
          text-align: center;
        }

        .messages-count strong {
          display: block;
          color: #086240;
          font-size: 18px;
        }

        .messages-count span {
          color: #88948e;
          font-size: 9px;
        }

        .messages-shell {
          min-height: 640px;
          display: grid;
          grid-template-columns:
            minmax(360px, 430px)
            minmax(0,1fr);
          overflow: hidden;
          border: 1px solid
            rgba(18,48,38,.07);
          border-radius: 24px;
          background: #fff;
          box-shadow:
            0 18px 50px
            rgba(19,45,34,.055);
        }

        .messages-list-panel {
          padding: 18px;
          border-right: 1px solid #edf1ee;
          background: #fbfcfb;
        }

        .messages-search {
          display: flex;
          align-items: center;
          gap: 9px;
          min-height: 44px;
          padding: 0 13px;
          border: 1px solid #e1e7e3;
          border-radius: 13px;
          background: #fff;
        }

        .messages-search span {
          color: #08704a;
        }

        .messages-search input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          font: inherit;
          font-size: 12px;
        }

        .messages-list-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 4px 9px;
        }

        .messages-list-heading strong {
          color: #263a31;
          font-size: 11px;
        }

        .messages-list-heading span {
          color: #8c9892;
          font-size: 10px;
        }

        .messages-list {
          display: grid;
          gap: 6px;
        }

        .conversation-row {
          display: flex;
          gap: 11px;
          padding: 13px;
          border: 1px solid transparent;
          border-radius: 15px;
          color: inherit;
          text-decoration: none;
          transition:
            background .15s ease,
            border .15s ease,
            transform .15s ease;
        }

        .conversation-row:hover {
          border-color: #dde7e1;
          background: #fff;
          transform: translateX(1px);
        }

        .conversation-avatar {
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          background:
            linear-gradient(
              145deg,
              #0a714b,
              #06452f
            );
          color: #fff;
          font-size: 12px;
          font-weight: 850;
        }

        .conversation-copy {
          min-width: 0;
          flex: 1;
        }

        .conversation-title-line {
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }

        .conversation-title-line strong {
          overflow: hidden;
          color: #1d3229;
          font-size: 11px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .conversation-title-line span {
          flex-shrink: 0;
          color: #9aa49f;
          font-size: 8px;
        }

        .conversation-copy p {
          overflow: hidden;
          margin: 5px 0 0;
          color: #75827c;
          font-size: 10px;
          line-height: 1.4;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .conversation-meta {
          display: flex;
          gap: 8px;
          margin-top: 7px;
          color: #98a29d;
          font-size: 8px;
          text-transform: lowercase;
        }

        .messages-state,
        .messages-empty {
          margin-top: 8px;
          padding: 26px 18px;
          border-radius: 15px;
          background: #fff;
          color: #78847e;
          text-align: center;
          font-size: 11px;
        }

        .messages-empty > div {
          font-size: 24px;
        }

        .messages-empty strong {
          display: block;
          margin-top: 9px;
          color: #263a31;
        }

        .messages-empty p {
          margin: 5px 0 0;
        }

        .messages-welcome {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 50px;
          text-align: center;
          background:
            radial-gradient(
              circle at 50% 30%,
              rgba(8,98,64,.07),
              transparent 34%
            ),
            #fff;
        }

        .messages-welcome-mark {
          width: 54px;
          height: 54px;
          display: grid;
          place-items: center;
          border-radius: 17px;
          background: #07583a;
          color: #fff;
          font-size: 18px;
          font-weight: 900;
        }

        .messages-welcome-eyebrow {
          margin-top: 20px;
          color: #0a6945;
          font-size: 9px;
          font-weight: 850;
          letter-spacing: .14em;
        }

        .messages-welcome h2 {
          max-width: 440px;
          margin: 10px 0 0;
          color: #102019;
          font-size: 30px;
          line-height: 1.1;
          letter-spacing: -.035em;
        }

        .messages-welcome > p {
          max-width: 440px;
          margin: 12px 0 0;
          color: #76837c;
          font-size: 12px;
          line-height: 1.6;
        }

        .messages-feature-grid {
          display: grid;
          grid-template-columns:
            repeat(3,minmax(0,1fr));
          gap: 10px;
          width: min(100%,560px);
          margin-top: 28px;
        }

        .messages-feature-grid > div {
          padding: 16px 10px;
          border: 1px solid #e7ece9;
          border-radius: 14px;
          background: #fff;
        }

        .messages-feature-grid span {
          display: block;
          color: #08704a;
          font-size: 17px;
        }

        .messages-feature-grid strong {
          display: block;
          margin-top: 6px;
          color: #405249;
          font-size: 9px;
        }

        @media (max-width: 900px) {
          .messages-shell {
            grid-template-columns: 1fr;
          }

          .messages-list-panel {
            border-right: 0;
          }

          .messages-welcome {
            min-height: 300px;
          }
        }

        @media (max-width: 700px) {
          .messages-page {
            width: min(100% - 28px,680px);
            padding-top: 24px;
          }

          .messages-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .messages-feature-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
