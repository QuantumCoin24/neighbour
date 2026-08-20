'use client';

import React, { useEffect } from 'react';

import Navigation from './Navigation';
import MobileNavigation from './MobileNavigation';

import { configureWebApiClient } from '../../lib/auth';

export default function AppShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    configureWebApiClient();
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FAF7F2',
        color: '#102019',
        display: 'flex',
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <aside
        className="desktop-nav"
        style={{
          width: '272px',
          padding: '28px 22px',
          background: '#063F2A',
          color: '#FFFFFF',
          borderRight: '1px solid rgba(255,255,255,.08)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '8px',
          }}
        >
          <img
            src="/brand/neighbour-mark.svg"
            alt="Neighbour"
            width={48}
            height={48}
            style={{
              borderRadius: '14px',
            }}
          />

          <div>
            <div
              style={{
                fontSize: '22px',
                fontWeight: 800,
                letterSpacing: '-.4px',
              }}
            >
              Neighbour™
            </div>

            <div
              style={{
                color: '#A7F3D0',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              Stronger together.
            </div>
          </div>
        </div>

        <div
          style={{
            color: 'rgba(255,255,255,.62)',
            fontSize: '12px',
            marginBottom: '26px',
            paddingLeft: '60px',
          }}
        >
          Local forever.
        </div>

        <Navigation />
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

      <style jsx>{`
        .desktop-nav {
          display: block;
          position: sticky;
          top: 0;
          height: 100vh;
          box-sizing: border-box;
        }

        @media (max-width: 768px) {
          .desktop-nav {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
