'use client';

import { useRef, useState } from 'react';

import {
  MAX_MEDIA_ITEMS,
  validateWebMediaFile,
  type WebPendingMedia,
} from '../../lib/media/upload';

interface Props {
  items: WebPendingMedia[];
  disabled?: boolean;
  onChange: (items: WebPendingMedia[]) => void;
}

export default function MediaPicker({
  items,
  disabled = false,
  onChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  function select(files: FileList | null) {
    if (!files) return;

    setError(null);

    const remaining = Math.max(0, MAX_MEDIA_ITEMS - items.length);
    const selected = Array.from(files).slice(0, remaining);

    const next: WebPendingMedia[] = [];

    for (const file of selected) {
      const validation = validateWebMediaFile(file);

      if (validation) {
        setError(validation);
        continue;
      }

      next.push({
        localId: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    onChange([...items, ...next]);

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  function remove(localId: string) {
    const target = items.find((item) => item.localId === localId);

    if (target) {
      URL.revokeObjectURL(target.previewUrl);
    }

    onChange(items.filter((item) => item.localId !== localId));
  }

  return (
    <div className="media-picker">
      <div className="picker-actions">
        <button
          disabled={disabled || items.length >= MAX_MEDIA_ITEMS}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          ＋ Add photos
        </button>

        <span>
          {items.length}/{MAX_MEDIA_ITEMS} photos
        </span>
      </div>

      <input
        ref={inputRef}
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        multiple
        onChange={(event) => select(event.target.files)}
        style={{ display: 'none' }}
        type="file"
      />

      {items.length > 0 ? (
        <div className="preview-grid">
          {items.map((item, index) => (
            <div className="preview" key={item.localId}>
              <img alt={`Selected photo ${index + 1}`} src={item.previewUrl} />

              <span className="position">{index + 1}</span>

              <button
                aria-label="Remove photo"
                disabled={disabled}
                onClick={() => remove(item.localId)}
                type="button"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {error ? <p className="picker-error">{error}</p> : null}

      <style jsx>{`
        .media-picker {
          margin-top: 14px;
        }

        .picker-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .picker-actions button {
          border: 1px solid #cfe1d7;
          border-radius: 999px;
          background: #eef8f2;
          color: #07633f;
          cursor: pointer;
          font-weight: 800;
          padding: 9px 15px;
        }

        .picker-actions button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .picker-actions span {
          color: #708078;
          font-size: 12px;
        }

        .preview-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
          margin-top: 12px;
        }

        .preview {
          position: relative;
          aspect-ratio: 1;
          overflow: hidden;
          border-radius: 14px;
          background: #edf3ef;
        }

        .preview img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .preview > button {
          position: absolute;
          right: 6px;
          top: 6px;
          width: 28px;
          height: 28px;
          display: grid;
          place-items: center;
          border: 0;
          border-radius: 50%;
          background: rgba(255,255,255,.94);
          color: #10231a;
          cursor: pointer;
          font-size: 19px;
        }

        .position {
          position: absolute;
          left: 6px;
          bottom: 6px;
          min-width: 25px;
          height: 25px;
          display: grid;
          place-items: center;
          padding: 0 6px;
          border-radius: 999px;
          background: #08714a;
          color: white;
          font-size: 11px;
          font-weight: 900;
        }

        .picker-error {
          margin: 8px 0 0;
          color: #a8322d;
          font-size: 12px;
        }

        @media (max-width: 650px) {
          .preview-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
      `}</style>
    </div>
  );
}
