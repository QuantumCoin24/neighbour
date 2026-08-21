'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const primaryLinks = [
  { href: '/home', label: 'Home', icon: '⌂' },
  { href: '/community', label: 'Communities', icon: '◉' },
  { href: '/my-community', label: 'Nearby', icon: '⌖' },
  { href: '/messages', label: 'Messages', icon: '□' },
];

const discoveryLinks = [
  { href: '/business/discover', label: 'Discover', icon: '⌕' },
  { href: '/notifications', label: 'Notifications', icon: '◇' },
  { href: '/search', label: 'Search', icon: '○' },
];

const accountLinks = [
  { href: '/profile/setup', label: 'Profile', icon: '◎' },
  {
    href: '/business',
    label: 'Business Centre',
    icon: '▣',
  },
  { href: '/settings', label: 'Settings', icon: '⚙' },
];

function NavigationGroup({
  label,
  links,
}: {
  label: string;
  links: typeof primaryLinks;
}) {
  const pathname = usePathname();

  return (
    <div style={{ marginBottom: '18px' }}>
      <div
        style={{
          margin: '0 12px 8px',
          color: 'rgba(255,255,255,.38)',
          fontSize: '10px',
          fontWeight: 800,
          letterSpacing: '.11em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
        }}
      >
        {links.map((link) => {
          const active =
            pathname === link.href ||
            pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={
                active
                  ? 'neighbour-nav-link neighbour-nav-link-active'
                  : 'neighbour-nav-link'
              }
            >
              <span
                className={
                  active
                    ? 'neighbour-nav-icon neighbour-nav-icon-active'
                    : 'neighbour-nav-icon'
                }
              >
                {link.icon}
              </span>

              <span>{link.label}</span>

              {active ? (
                <span
                  style={{
                    marginLeft: 'auto',
                    width: '6px',
                    height: '6px',
                    borderRadius: '999px',
                    background: '#0E754D',
                  }}
                />
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function Navigation() {
  return (
    <nav>
      <NavigationGroup
        label="Neighbourhood"
        links={primaryLinks}
      />

      <NavigationGroup
        label="Explore"
        links={discoveryLinks}
      />

      <NavigationGroup
        label="You"
        links={accountLinks}
      />

      <style>{`
        .neighbour-nav-link {
          display: flex;
          align-items: center;
          gap: 11px;
          min-height: 42px;
          padding: 7px 10px;
          box-sizing: border-box;
          border-radius: 13px;
          color: rgba(255,255,255,.76);
          text-decoration: none;
          font-size: 13px;
          font-weight: 680;
          transition:
            background .16s ease,
            color .16s ease,
            transform .16s ease;
        }

        .neighbour-nav-link:hover {
          color: #ffffff;
          background: rgba(255,255,255,.07);
          transform: translateX(1px);
        }

        .neighbour-nav-link-active {
          color: #063f2a;
          background: #e8f5ed;
          font-weight: 820;
          box-shadow: 0 7px 20px rgba(0,0,0,.08);
        }

        .neighbour-nav-link-active:hover {
          color: #063f2a;
          background: #eef8f2;
        }

        .neighbour-nav-icon {
          width: 28px;
          height: 28px;
          flex: 0 0 28px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: rgba(255,255,255,.075);
          color: rgba(255,255,255,.84);
          font-size: 15px;
        }

        .neighbour-nav-icon-active {
          background: #ffffff;
          color: #086240;
          box-shadow: 0 3px 10px rgba(6,63,42,.08);
        }
      `}</style>
    </nav>
  );
}
