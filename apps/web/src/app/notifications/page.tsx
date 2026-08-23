'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type Notification,
} from '@neighbour/api-client';

function notificationLabel(type: string) {
  return type
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function notificationIcon(type: string) {
  if (type.includes('MESSAGE')) {
    return '□';
  }

  if (type.includes('COMMUNITY')) {
    return '⌂';
  }

  if (type.includes('REACTION') || type.includes('COMMENT') || type.includes('REPLY')) {
    return '♡';
  }

  if (type.includes('CONNECTION')) {
    return '◎';
  }

  if (type.includes('MARKETPLACE')) {
    return '▣';
  }

  return '◇';
}

function formatDate(value: string) {
  return new Date(value).toLocaleString([], {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);

  const [unread, setUnread] = useState(0);

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const [message, setMessage] = useState('Loading notifications…');

  const [busy, setBusy] = useState(false);

  async function load() {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      setMessage('Please sign in first.');
      return;
    }

    try {
      const result = await getNotifications(token, {
        limit: 100,
      });

      setItems(result.items);
      setUnread(result.unreadCount);
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load notifications.');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(
    () => (filter === 'unread' ? items.filter((item) => !item.readAt) : items),
    [items, filter],
  );

  async function read(id: string) {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      return;
    }

    const target = items.find((item) => item.id === id);

    if (target?.readAt) {
      return;
    }

    try {
      await markNotificationRead(token, id);

      await load();
    } catch {
      // Keep current UI if the network request fails.
    }
  }

  async function readAll() {
    const token = localStorage.getItem('accessToken');

    if (!token || busy || unread === 0) {
      return;
    }

    setBusy(true);

    try {
      await markAllNotificationsRead(token);

      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="notifications-page">
      <header className="notifications-header">
        <div>
          <div className="notifications-eyebrow">STAY CONNECTED</div>

          <h1>Notifications</h1>

          <p>Activity from your neighbourhood, conversations and local network.</p>
        </div>

        <button type="button" disabled={busy || unread === 0} onClick={() => void readAll()}>
          {busy ? 'Updating…' : 'Mark all as read'}
        </button>
      </header>

      <section className="notifications-overview">
        <div>
          <span>UNREAD</span>

          <strong>{unread}</strong>

          <p>items needing your attention</p>
        </div>

        <section>
          <h2>Your neighbourhood activity</h2>

          <p>Messages, reactions, community activity and account updates all appear here.</p>
        </section>

        <div className="notifications-live">
          <span />
          Live activity
        </div>
      </section>

      <section className="notifications-toolbar">
        <div>
          <button
            type="button"
            className={filter === 'all' ? 'notification-filter-active' : ''}
            onClick={() => setFilter('all')}
          >
            All
          </button>

          <button
            type="button"
            className={filter === 'unread' ? 'notification-filter-active' : ''}
            onClick={() => setFilter('unread')}
          >
            Unread
          </button>
        </div>

        <span>
          {visible.length} {visible.length === 1 ? 'notification' : 'notifications'}
        </span>
      </section>

      {message ? (
        <div className="notifications-message">{message}</div>
      ) : visible.length === 0 ? (
        <section className="notifications-empty">
          <div>◇</div>

          <h2>You’re all caught up.</h2>

          <p>New neighbourhood activity will appear here.</p>
        </section>
      ) : (
        <section className="notifications-list">
          {visible.map((item) => {
            const isUnread = !item.readAt;

            return (
              <button
                key={item.id}
                type="button"
                className={
                  isUnread ? 'notification-item notification-item-unread' : 'notification-item'
                }
                onClick={() => void read(item.id)}
              >
                <div className="notification-icon">{notificationIcon(item.type)}</div>

                <div className="notification-copy">
                  <div className="notification-title">
                    <strong>{notificationLabel(item.type)}</strong>

                    {isUnread ? <span>New</span> : null}
                  </div>

                  <p>
                    {item.actor
                      ? `${item.actor.displayName} interacted with your neighbourhood.`
                      : 'Neighbour™ activity update.'}
                  </p>

                  <small>{formatDate(item.createdAt)}</small>
                </div>

                <div className="notification-arrow">→</div>
              </button>
            );
          })}
        </section>
      )}

      <style>{`
        .notifications-page {
          width: min(100% - 48px,1200px);
          margin: 0 auto;
          padding: 42px 0 90px;
        }

        .notifications-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 26px;
        }

        .notifications-eyebrow {
          margin-bottom: 8px;
          color: #0a6945;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: .15em;
        }

        .notifications-header h1 {
          margin: 0;
          color: #102019;
          font-size: clamp(32px,4vw,48px);
          letter-spacing: -.045em;
        }

        .notifications-header p {
          margin: 9px 0 0;
          color: #75827c;
          font-size: 14px;
        }

        .notifications-header > button {
          padding: 12px 16px;
          border: 1px solid #dce4df;
          border-radius: 12px;
          background: #fff;
          color: #234037;
          font: inherit;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
        }

        .notifications-header > button:disabled {
          opacity: .45;
          cursor: default;
        }

        .notifications-overview {
          display: grid;
          grid-template-columns:
            180px minmax(0,1fr) auto;
          align-items: center;
          gap: 24px;
          padding: 23px;
          border-radius: 21px;
          background:
            linear-gradient(
              120deg,
              #0a1729,
              #122e4d
            );
          color: #fff;
        }

        .notifications-overview > div:first-child span {
          color: #8edcb9;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: .13em;
        }

        .notifications-overview > div:first-child strong {
          display: block;
          margin-top: 4px;
          font-size: 34px;
        }

        .notifications-overview > div:first-child p {
          margin: 2px 0 0;
          color: rgba(255,255,255,.6);
          font-size: 9px;
        }

        .notifications-overview section {
          padding-left: 23px;
          border-left:
            1px solid rgba(255,255,255,.12);
        }

        .notifications-overview h2 {
          margin: 0;
          font-size: 17px;
        }

        .notifications-overview section p {
          margin: 5px 0 0;
          max-width: 510px;
          color: rgba(255,255,255,.66);
          font-size: 10px;
          line-height: 1.5;
        }

        .notifications-live {
          display: flex;
          gap: 7px;
          align-items: center;
          color: rgba(255,255,255,.8);
          font-size: 9px;
          font-weight: 750;
        }

        .notifications-live span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #42d48b;
        }

        .notifications-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 25px 0 12px;
        }

        .notifications-toolbar > div {
          display: flex;
          gap: 6px;
        }

        .notifications-toolbar button {
          padding: 8px 12px;
          border: 1px solid #dde5e1;
          border-radius: 10px;
          background: #fff;
          color: #66766e;
          font: inherit;
          font-size: 9px;
          font-weight: 800;
          cursor: pointer;
        }

        .notifications-toolbar .notification-filter-active {
          border-color: #086240;
          background: #086240;
          color: #fff;
        }

        .notifications-toolbar > span {
          color: #909b95;
          font-size: 9px;
        }

        .notifications-list {
          display: grid;
          gap: 8px;
        }

        .notification-item {
          width: 100%;
          box-sizing: border-box;
          display: grid;
          grid-template-columns:
            auto minmax(0,1fr) auto;
          gap: 13px;
          align-items: center;
          padding: 15px;
          border: 1px solid #e4eae6;
          border-radius: 15px;
          background: #fff;
          text-align: left;
          cursor: pointer;
        }

        .notification-item-unread {
          border-color: #cfe2d8;
          background:
            linear-gradient(
              90deg,
              #f3faf6,
              #fff
            );
        }

        .notification-icon {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #eaf5ef;
          color: #08704a;
          font-size: 16px;
        }

        .notification-title {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .notification-title strong {
          color: #24382f;
          font-size: 11px;
        }

        .notification-title span {
          padding: 4px 6px;
          border-radius: 999px;
          background: #086240;
          color: #fff;
          font-size: 7px;
          font-weight: 800;
        }

        .notification-copy p {
          margin: 4px 0 0;
          color: #607168;
          font-size: 10px;
        }

        .notification-copy small {
          display: block;
          margin-top: 5px;
          color: #9aa49f;
          font-size: 8px;
        }

        .notification-arrow {
          color: #8e9a94;
          font-size: 13px;
        }

        .notifications-message,
        .notifications-empty {
          padding: 40px;
          border: 1px dashed #dae2dd;
          border-radius: 18px;
          background: rgba(255,255,255,.6);
          text-align: center;
          color: #74817b;
        }

        .notifications-empty > div {
          font-size: 28px;
        }

        .notifications-empty h2 {
          margin: 10px 0 0;
          color: #263a31;
        }

        .notifications-empty p {
          margin: 6px 0 0;
          font-size: 11px;
        }

        @media (max-width: 760px) {
          .notifications-page {
            width: min(100% - 28px,680px);
            padding-top: 24px;
          }

          .notifications-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .notifications-overview {
            grid-template-columns: 1fr;
          }

          .notifications-overview section {
            padding-left: 0;
            padding-top: 15px;
            border-left: 0;
            border-top:
              1px solid rgba(255,255,255,.12);
          }
        }
      `}</style>
    </main>
  );
}
