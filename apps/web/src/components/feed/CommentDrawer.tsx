'use client';

import { useEffect, useState } from 'react';

import { getComments, createComment } from '@neighbour/api-client';

export default function CommentDrawer({ postId }: { postId: string }) {
  const [open, setOpen] = useState(false);

  const [comments, setComments] = useState<any[]>([]);

  const [text, setText] = useState('');

  async function load() {
    const token = localStorage.getItem('accessToken');

    if (!token) return;

    const result = await getComments(token, postId);

    setComments(result.items);
  }

  async function submit() {
    const token = localStorage.getItem('accessToken');

    if (!token) return;

    if (!text.trim()) return;

    await createComment(token, postId, text);

    setText('');

    await load();
  }

  async function toggle() {
    setOpen((value) => !value);

    if (!open) {
      await load();
    }
  }

  return (
    <div>
      <button
        onClick={toggle}
        style={{
          border: 'none',
          background: '#f5f5f5',
          borderRadius: '20px',
          padding: '8px 18px',
          cursor: 'pointer',
        }}
      >
        💬 {comments.length}
      </button>

      {open && (
        <div
          style={{
            marginTop: '15px',
            padding: '15px',
            background: '#fafafa',
            borderRadius: '15px',
          }}
        >
          {comments.map((comment) => (
            <div
              key={comment.id}
              style={{
                marginBottom: '12px',
              }}
            >
              <strong>{comment.author.displayName}</strong>

              <p>{comment.content}</p>
            </div>
          ))}

          <textarea
            value={text}

            onChange={(event) => setText(event.target.value)}

            placeholder="Write a comment..."

            style={{
              width: '100%',
              minHeight: '70px',
            }}
          />

          <button onClick={submit}>Post Comment</button>
        </div>
      )}
    </div>
  );
}
