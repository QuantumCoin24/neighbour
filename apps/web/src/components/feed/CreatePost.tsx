'use client';

import type { WebPendingMedia } from '../../lib/media/upload';
import MediaPicker from '../media/MediaPicker';

interface Props {
  content: string;
  setContent: (value: string) => void;
  submit: () => void | Promise<void>;
  media: WebPendingMedia[];
  setMedia: (value: WebPendingMedia[]) => void;
  busy?: boolean;
  uploadProgress?: number;
  error?: string | null;
}

export default function CreatePost({
  content,
  setContent,
  submit,
  media,
  setMedia,
  busy = false,
  uploadProgress = 0,
  error = null,
}: Props) {
  return (
    <section className="create-post">
      <textarea
        disabled={busy}
        onChange={(event) => setContent(event.target.value)}
        placeholder="What's happening in your community?"
        value={content}
      />

      <MediaPicker
        disabled={busy}
        items={media}
        onChange={setMedia}
      />

      {busy ? (
        <div className="progress">
          <div>
            <strong>Uploading photos</strong>
            <span>{Math.round(uploadProgress * 100)}%</span>
          </div>

          <div className="track">
            <span
              style={{
                width: `${Math.max(2, uploadProgress * 100)}%`,
              }}
            />
          </div>
        </div>
      ) : null}

      {error ? <p className="error">{error}</p> : null}

      <div className="actions">
        <button
          disabled={busy || (!content.trim() && media.length === 0)}
          onClick={() => void submit()}
          type="button"
        >
          {busy ? 'Publishing…' : 'Post'}
        </button>
      </div>

      <style jsx>{`
        .create-post {
          background: #fff;
          border: 1px solid #e0e8e3;
          border-radius: 22px;
          padding: 20px;
          margin-bottom: 30px;
        }

        textarea {
          box-sizing: border-box;
          width: 100%;
          min-height: 120px;
          resize: vertical;
          border: 1px solid #dce6e0;
          border-radius: 15px;
          padding: 15px;
          background: #fbfcfb;
          color: #10231a;
          font: inherit;
          font-size: 16px;
          outline: none;
        }

        textarea:focus {
          border-color: #76ad91;
          box-shadow: 0 0 0 3px rgba(8,113,74,.08);
        }

        .actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 15px;
        }

        .actions button {
          border: 0;
          border-radius: 999px;
          padding: 11px 28px;
          background: #08714a;
          color: white;
          cursor: pointer;
          font-weight: 850;
        }

        .actions button:disabled {
          cursor: not-allowed;
          opacity: .52;
        }

        .progress {
          margin-top: 14px;
          padding: 12px 14px;
          border-radius: 14px;
          background: #f2f8f4;
        }

        .progress > div:first-child {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 8px;
          font-size: 12px;
        }

        .track {
          height: 7px;
          overflow: hidden;
          border-radius: 999px;
          background: #dce9e1;
        }

        .track span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: #08714a;
          transition: width .2s ease;
        }

        .error {
          margin: 12px 0 0;
          color: #a8322d;
          font-size: 13px;
        }
      `}</style>
    </section>
  );
}
