'use client';

import type { PostMedia } from '@neighbour/api-client';
import { useEffect, useState } from 'react';

export default function MediaGallery({
  items,
}: {
  items: PostMedia[];
}) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  useEffect(() => {
    if (viewerIndex === null) return;

    function keydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setViewerIndex(null);
      }

      if (event.key === 'ArrowRight') {
        setViewerIndex((current) =>
          current === null ? null : Math.min(items.length - 1, current + 1),
        );
      }

      if (event.key === 'ArrowLeft') {
        setViewerIndex((current) =>
          current === null ? null : Math.max(0, current - 1),
        );
      }
    }

    window.addEventListener('keydown', keydown);

    return () => window.removeEventListener('keydown', keydown);
  }, [items.length, viewerIndex]);

  if (!items.length) return null;

  const visible = items.slice(0, 4);
  const overflow = Math.max(0, items.length - 4);
  const selected =
    viewerIndex === null ? null : items[viewerIndex];

  return (
    <>
      <div
        className={`gallery gallery-${Math.min(items.length, 4)}`}
      >
        {visible.map((item, index) => (
          <button
            aria-label={item.altText ?? `Open photo ${index + 1}`}
            key={item.id}
            onClick={() => setViewerIndex(index)}
            type="button"
          >
            {item.asset.url ? (
              <img
                alt={item.altText ?? `Photo ${index + 1}`}
                src={item.asset.url}
              />
            ) : (
              <span>Photo unavailable</span>
            )}

            {index === 3 && overflow > 0 ? (
              <strong className="overflow">+{overflow}</strong>
            ) : null}
          </button>
        ))}
      </div>

      {selected ? (
        <div
          aria-modal="true"
          className="viewer"
          role="dialog"
        >
          <div className="viewer-top">
            <button
              aria-label="Close photo viewer"
              onClick={() => setViewerIndex(null)}
              type="button"
            >
              ×
            </button>

            <strong>
              {(viewerIndex ?? 0) + 1} / {items.length}
            </strong>

            <span />
          </div>

          <div className="viewer-body">
            <button
              aria-label="Previous photo"
              disabled={viewerIndex === 0}
              onClick={() =>
                setViewerIndex((current) =>
                  current === null ? null : Math.max(0, current - 1),
                )
              }
              type="button"
            >
              ‹
            </button>

            {selected.asset.url ? (
              <img
                alt={selected.altText ?? `Photo ${(viewerIndex ?? 0) + 1}`}
                src={selected.asset.url}
              />
            ) : (
              <div className="unavailable">Photo unavailable</div>
            )}

            <button
              aria-label="Next photo"
              disabled={viewerIndex === items.length - 1}
              onClick={() =>
                setViewerIndex((current) =>
                  current === null
                    ? null
                    : Math.min(items.length - 1, current + 1),
                )
              }
              type="button"
            >
              ›
            </button>
          </div>
        </div>
      ) : null}

      <style jsx>{`
        .gallery {
          display: grid;
          gap: 3px;
          overflow: hidden;
          margin: 4px 0 20px;
          border-radius: 18px;
        }

        .gallery button {
          position: relative;
          overflow: hidden;
          min-height: 220px;
          border: 0;
          padding: 0;
          background: #edf3ef;
          cursor: pointer;
        }

        .gallery img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .gallery-1 {
          grid-template-columns: 1fr;
          max-height: 520px;
        }

        .gallery-2 {
          grid-template-columns: repeat(2, 1fr);
          height: 360px;
        }

        .gallery-3,
        .gallery-4 {
          grid-template-columns: repeat(2, 1fr);
          height: 430px;
        }

        .gallery-3 button:first-child {
          grid-row: span 2;
        }

        .overflow {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          background: rgba(0,0,0,.52);
          color: white;
          font-size: 32px;
        }

        .viewer {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(0,0,0,.96);
          color: white;
        }

        .viewer-top {
          height: 64px;
          display: grid;
          grid-template-columns: 50px 1fr 50px;
          align-items: center;
          text-align: center;
          padding: 0 16px;
        }

        .viewer-top button,
        .viewer-body button {
          border: 0;
          background: transparent;
          color: white;
          cursor: pointer;
        }

        .viewer-top button {
          font-size: 34px;
        }

        .viewer-body {
          height: calc(100vh - 64px);
          display: grid;
          grid-template-columns: 70px 1fr 70px;
          align-items: center;
        }

        .viewer-body img {
          max-width: 100%;
          max-height: calc(100vh - 95px);
          justify-self: center;
          object-fit: contain;
        }

        .viewer-body button {
          height: 100%;
          font-size: 54px;
        }

        .viewer-body button:disabled {
          opacity: .2;
          cursor: default;
        }

        .unavailable {
          text-align: center;
          color: #ccc;
        }

        @media (max-width: 650px) {
          .gallery-2,
          .gallery-3,
          .gallery-4 {
            height: 300px;
          }

          .viewer-body {
            grid-template-columns: 42px 1fr 42px;
          }
        }
      `}</style>
    </>
  );
}
