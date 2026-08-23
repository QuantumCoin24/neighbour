'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import Navigation from './Navigation';
import MobileNavigation from './MobileNavigation';

import { configureWebApiClient } from '../../lib/auth';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    configureWebApiClient();
  }, []);

  const publicRoute = pathname === '/auth' || pathname.startsWith('/auth/');

  if (publicRoute) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#F6F3ED',
          color: '#102019',
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F7F4EE',
        color: '#102019',
        display: 'flex',
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <aside className="desktop-neighbour-shell">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '2px 6px 0',
          }}
        >
          <img
            src="/brand/neighbour-mark.svg"
            alt="Neighbour"
            width={44}
            height={44}
            style={{
              borderRadius: '13px',
              flexShrink: 0,
            }}
          />

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 850,
                letterSpacing: '-0.5px',
                lineHeight: 1.05,
              }}
            >
              Neighbour™
            </div>

            <div
              style={{
                marginTop: '4px',
                color: '#A7F3D0',
                fontSize: '11px',
                fontWeight: 750,
                letterSpacing: '.01em',
              }}
            >
              Stronger together.
            </div>
          </div>
        </div>

        <div
          style={{
            margin: '11px 6px 25px 56px',
            color: 'rgba(255,255,255,.50)',
            fontSize: '11px',
            fontWeight: 600,
          }}
        >
          Local forever.
        </div>

        <Navigation />

        <div
          style={{
            marginTop: 'auto',
            padding: '18px 8px 4px',
          }}
        >
          <div
            style={{
              paddingTop: '16px',
              borderTop: '1px solid rgba(255,255,255,.10)',
              color: 'rgba(255,255,255,.48)',
              fontSize: '11px',
              lineHeight: 1.5,
            }}
          >
            Your neighbourhood.
            <br />
            One connected place.
          </div>
        </div>
      </aside>

      <main
        style={{
          flex: 1,
          minWidth: 0,
          paddingBottom: '96px',
        }}
      >
        {children}
      </main>

      <MobileNavigation />

      <style>{`
        .desktop-neighbour-shell {
          width: 248px;
          min-width: 248px;
          height: 100vh;
          box-sizing: border-box;
          position: sticky;
          top: 0;
          padding: 24px 18px 18px;
          display: flex;
          flex-direction: column;
          background:
            linear-gradient(
              180deg,
              #06452f 0%,
              #053d2a 58%,
              #043522 100%
            );
          color: #ffffff;
          border-right: 1px solid rgba(255,255,255,.08);
          box-shadow: 14px 0 38px rgba(6,63,42,.05);
          z-index: 20;
        }

        @media (max-width: 768px) {
          .desktop-neighbour-shell {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
