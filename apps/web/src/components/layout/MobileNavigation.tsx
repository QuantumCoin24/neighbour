'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  {
    href: '/home',
    label: 'Home',
    icon: '⌂',
  },
  {
    href: '/community',
    label: 'Communities',
    icon: '◉',
  },
  {
    href: '/my-community',
    label: 'Nearby',
    icon: '⌖',
    primary: true,
  },
  {
    href: '/messages',
    label: 'Messages',
    icon: '▢',
  },
  {
    href: '/profile/setup',
    label: 'Profile',
    icon: '◎',
  },
];

export default function MobileNavigation() {
  const pathname = usePathname();

  return (
    <nav
      className="mobile-neighbour-nav"
      style={{
        position: 'fixed',

        bottom: '12px',
        left: '12px',
        right: '12px',

        minHeight: '70px',

        background: 'rgba(255,255,255,.96)',

        border: '1px solid #E2E8E4',
        borderRadius: '24px',

        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',

        zIndex: 1000,

        boxShadow: '0 12px 36px rgba(6,63,42,.13)',

        backdropFilter: 'blur(18px)',

        padding: '6px',
      }}
    >
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            style={{
              width: item.primary ? '58px' : '52px',

              height: item.primary ? '58px' : '52px',

              display: 'grid',
              placeItems: 'center',

              borderRadius: '50%',

              textDecoration: 'none',

              fontSize: item.primary ? '25px' : '21px',

              fontWeight: 800,

              background: item.primary ? '#0E5B3A' : active ? '#E1F3E8' : 'transparent',

              color: item.primary ? '#FFFFFF' : active ? '#0E5B3A' : '#64748B',

              boxShadow: item.primary ? '0 8px 20px rgba(14,91,58,.24)' : 'none',

              transform: item.primary ? 'translateY(-7px)' : 'none',
            }}
          >
            {item.icon}
          </Link>
        );
      })}

      <style jsx>{`
        @media (min-width: 769px) {
          .mobile-neighbour-nav {
            display: none !important;
          }
        }
      `}</style>
    </nav>
  );
}
