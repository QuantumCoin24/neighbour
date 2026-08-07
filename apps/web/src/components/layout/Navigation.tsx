'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/home', label: 'Home', icon: '⌂' },
  { href: '/community', label: 'Communities', icon: '◉' },
  { href: '/my-community', label: 'Nearby', icon: '⌖' },
  { href: '/messages', label: 'Messages', icon: '▢' },
  { href: '/business/discover', label: 'Discover', icon: '⌕' },
  { href: '/notifications', label: 'Notifications', icon: '◇' },
  { href: '/search', label: 'Search', icon: '◌' },
  { href: '/profile/setup', label: 'Profile', icon: '◎' },
  { href: '/business/dashboard', label: 'Business Centre', icon: '▣' },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '7px',
      }}
    >
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '13px',
              padding: '12px 14px',
              borderRadius: '18px',
              textDecoration: 'none',

              color: active ? '#063F2A' : 'rgba(255,255,255,.82)',

              background: active ? '#E1F3E8' : 'transparent',

              fontWeight: active ? 800 : 650,

              transition: 'all .18s ease',
            }}
          >
            <span
              style={{
                width: '31px',
                height: '31px',

                borderRadius: '12px',

                display: 'grid',
                placeItems: 'center',

                background: active ? '#FFFFFF' : 'rgba(255,255,255,.08)',

                fontSize: '17px',
              }}
            >
              {link.icon}
            </span>

            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
