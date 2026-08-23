'use client';

import Link from 'next/link';

import { useEffect, useState } from 'react';

import { useParams } from 'next/navigation';

import ReportButton from '../../../components/security/ReportButton';

import {
  getConversation,
  getMessages,
  markConversationRead,
  sendMessage,
  type Conversation,
  type Message,
} from '@neighbour/api-client';

function formatMessageTime(value: string) {
  return new Date(value).toLocaleString([], {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ConversationPage() {
  const params = useParams();

  const conversationId = params.conversationId as string;

  const [conversation, setConversation] = useState<Conversation | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);

  const [content, setContent] = useState('');

  const [busy, setBusy] = useState(false);

  const [error, setError] = useState('');

  async function load() {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      setError('Please sign in first.');
      return;
    }

    try {
      const conversationResponse = await getConversation(token, conversationId);

      setConversation(conversationResponse);

      const feed = await getMessages(token, conversationId, {
        limit: 100,
      });

      setMessages(feed.items);

      await markConversationRead(token, conversationId);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load conversation.');
    }
  }

  useEffect(() => {
    void load();
  }, [conversationId]);

  async function send() {
    const token = localStorage.getItem('accessToken');

    if (!token || !content.trim() || busy) {
      return;
    }

    setBusy(true);
    setError('');

    try {
      await sendMessage(token, conversationId, content.trim());

      setContent('');

      await load();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Unable to send message.');
    } finally {
      setBusy(false);
    }
  }

  if (!conversation) {
    return (
      <main className="conversation-loading">
        {error || 'Loading conversation…'}

        <style>{`
          .conversation-loading {
            width: min(100% - 48px,900px);
            margin: 80px auto;
            padding: 24px;
            border-radius: 18px;
            background: #fff;
            color: #65736c;
          }
        `}</style>
      </main>
    );
  }

  const title =
    conversation.title ||
    conversation.members
      .map((member) => member.user.displayName)
      .slice(0, 4)
      .join(', ') ||
    'Conversation';

  return (
    <main className="conversation-page">
      <header className="conversation-header">
        <Link href="/messages">← Messages</Link>

        <div className="conversation-heading">
          <div>
            <div className="conversation-eyebrow">NEIGHBOUR™ MESSAGE</div>

            <h1>{title}</h1>

            <p>
              {conversation.members.length}{' '}
              {conversation.members.length === 1 ? 'member' : 'members'}
            </p>
          </div>

          <div className="conversation-status">
            <span />
            Conversation active
          </div>
        </div>
      </header>

      <section className="conversation-shell">
        <div className="conversation-thread">
          {messages.length === 0 ? (
            <div className="conversation-empty">
              <div>□</div>

              <h2>Start the conversation</h2>

              <p>Send the first message below.</p>
            </div>
          ) : (
            messages.map((message) => (
              <article key={message.id} className="message-bubble">
                <div className="message-avatar">
                  {message.sender.displayName.slice(0, 2).toUpperCase()}
                </div>

                <div className="message-content">
                  <div className="message-author">
                    <strong>{message.sender.displayName}</strong>

                    <span>{formatMessageTime(message.createdAt)}</span>
                  </div>

                  <p>{message.content || 'Message'}</p>

                  <div className="message-safety">
                    <ReportButton targetType="MESSAGE" targetId={message.id} />
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        <aside className="conversation-info">
          <div className="conversation-info-label">CONVERSATION</div>

          <h2>Participants</h2>

          <div className="participant-list">
            {conversation.members.map((member) => (
              <div key={member.user.id} className="participant">
                <div>{member.user.displayName.slice(0, 2).toUpperCase()}</div>

                <section>
                  <strong>{member.user.displayName}</strong>

                  <span>{member.role}</span>
                </section>
              </div>
            ))}
          </div>

          <div className="conversation-safety-note">
            <strong>Neighbour™ safety</strong>

            <p>Report individual messages whenever something needs review.</p>
          </div>
        </aside>

        <section className="conversation-composer">
          {error ? <div className="conversation-error">{error}</div> : null}

          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write a message…"
          />

          <div className="composer-footer">
            <span>Keep conversations respectful and local.</span>

            <button type="button" disabled={busy || !content.trim()} onClick={() => void send()}>
              {busy ? 'Sending…' : 'Send message'}
            </button>
          </div>
        </section>
      </section>

      <style>{`
        .conversation-page {
          width: min(100% - 48px,1420px);
          margin: 0 auto;
          padding: 36px 0 90px;
        }

        .conversation-header > a {
          color: #0a6945;
          text-decoration: none;
          font-size: 11px;
          font-weight: 800;
        }

        .conversation-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin: 20px 0 24px;
        }

        .conversation-eyebrow {
          margin-bottom: 7px;
          color: #0a6945;
          font-size: 9px;
          font-weight: 850;
          letter-spacing: .14em;
        }

        .conversation-heading h1 {
          margin: 0;
          color: #102019;
          font-size: clamp(28px,3vw,40px);
          letter-spacing: -.04em;
        }

        .conversation-heading p {
          margin: 6px 0 0;
          color: #78857f;
          font-size: 11px;
        }

        .conversation-status {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #52645b;
          font-size: 10px;
          font-weight: 750;
        }

        .conversation-status span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #2bbf74;
        }

        .conversation-shell {
          display: grid;
          grid-template-columns:
            minmax(0,1fr)
            300px;
          overflow: hidden;
          border: 1px solid rgba(18,48,38,.07);
          border-radius: 23px;
          background: #fff;
          box-shadow:
            0 18px 50px
            rgba(19,45,34,.05);
        }

        .conversation-thread {
          min-height: 520px;
          max-height: 680px;
          overflow-y: auto;
          padding: 24px;
          background: #fafbf9;
        }

        .message-bubble {
          display: flex;
          gap: 11px;
          margin-bottom: 15px;
        }

        .message-avatar {
          width: 36px;
          height: 36px;
          flex: 0 0 36px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #e9f4ee;
          color: #08704a;
          font-size: 10px;
          font-weight: 850;
        }

        .message-content {
          max-width: 72%;
          padding: 13px 15px;
          border: 1px solid #e5ebe7;
          border-radius: 5px 16px 16px 16px;
          background: #fff;
        }

        .message-author {
          display: flex;
          gap: 14px;
          align-items: center;
        }

        .message-author strong {
          color: #24382f;
          font-size: 10px;
        }

        .message-author span {
          color: #9aa49f;
          font-size: 8px;
        }

        .message-content p {
          margin: 7px 0 0;
          color: #46584f;
          font-size: 12px;
          line-height: 1.55;
        }

        .message-safety {
          margin-top: 8px;
          opacity: .62;
        }

        .conversation-empty {
          padding: 100px 20px;
          text-align: center;
          color: #7c8982;
        }

        .conversation-empty > div {
          font-size: 28px;
        }

        .conversation-empty h2 {
          margin: 10px 0 0;
          color: #253a30;
        }

        .conversation-empty p {
          margin: 5px 0 0;
          font-size: 11px;
        }

        .conversation-info {
          padding: 22px;
          border-left: 1px solid #edf1ee;
        }

        .conversation-info-label {
          color: #0a6945;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: .13em;
        }

        .conversation-info h2 {
          margin: 7px 0 15px;
          font-size: 17px;
        }

        .participant-list {
          display: grid;
          gap: 8px;
        }

        .participant {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 9px;
          border-radius: 11px;
          background: #f7f9f8;
        }

        .participant > div {
          width: 31px;
          height: 31px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: #e7f3ed;
          color: #08704a;
          font-size: 9px;
          font-weight: 850;
        }

        .participant section {
          display: grid;
          gap: 2px;
        }

        .participant strong {
          color: #31453b;
          font-size: 9px;
        }

        .participant span {
          color: #95a09a;
          font-size: 7px;
        }

        .conversation-safety-note {
          margin-top: 20px;
          padding: 14px;
          border-radius: 13px;
          background: #eef6f2;
        }

        .conversation-safety-note strong {
          color: #14583d;
          font-size: 10px;
        }

        .conversation-safety-note p {
          margin: 5px 0 0;
          color: #65756d;
          font-size: 9px;
          line-height: 1.5;
        }

        .conversation-composer {
          grid-column: 1 / -1;
          padding: 16px;
          border-top: 1px solid #edf1ee;
          background: #fff;
        }

        .conversation-composer textarea {
          width: 100%;
          min-height: 76px;
          resize: vertical;
          box-sizing: border-box;
          padding: 13px;
          border: 1px solid #dce4df;
          border-radius: 13px;
          outline: none;
          background: #fbfcfb;
          font: inherit;
          font-size: 12px;
        }

        .composer-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          margin-top: 10px;
        }

        .composer-footer span {
          color: #8d9892;
          font-size: 9px;
        }

        .composer-footer button {
          padding: 11px 16px;
          border: 0;
          border-radius: 11px;
          background: #086240;
          color: #fff;
          font: inherit;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
        }

        .composer-footer button:disabled {
          opacity: .5;
          cursor: default;
        }

        .conversation-error {
          margin-bottom: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          background: #fff1dc;
          color: #78571c;
          font-size: 10px;
        }

        @media (max-width: 900px) {
          .conversation-shell {
            grid-template-columns: 1fr;
          }

          .conversation-info {
            border-left: 0;
            border-top: 1px solid #edf1ee;
          }
        }

        @media (max-width: 700px) {
          .conversation-page {
            width: min(100% - 28px,680px);
          }

          .conversation-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .message-content {
            max-width: calc(100% - 48px);
          }
        }
      `}</style>
    </main>
  );
}
