'use client';

import Link from 'next/link';

const cards = [
  {
    title: 'Business Centre',
    description: 'Your complete business command centre.',
    href: '/business/dashboard',
    icon: '🏢',
  },

  {
    title: 'Business Profile',
    description: 'Manage your public business identity.',
    href: '/business/profile',
    icon: '📇',
  },

  {
    title: 'Verification',
    description: 'Build trust with your community.',
    href: '/business/verification',
    icon: '✅',
  },

  {
    title: 'Offers',
    description: 'Create and manage community offers.',
    href: '/business/offers',
    icon: '🏷️',
  },

  {
    title: 'Events',
    description: 'Promote local events.',
    href: '/business/events',
    icon: '📅',
  },

  {
    title: 'Analytics',
    description: 'Understand your community reach.',
    href: '/business/analytics',
    icon: '📊',
  },
];

export default function BusinessPortal() {
  return (
    <main style={page}>
      <section style={hero}>
        <h1>🏪 Neighbour™ Business Portal</h1>

        <p>Manage your local business presence inside your community.</p>
      </section>

      <section style={grid}>
        {cards.map((card) => (
          <Link
            key={card.href}

            href={card.href}

            style={link}
          >
            <div style={cardStyle}>
              <h2>
                {card.icon} {card.title}
              </h2>

              <p>{card.description}</p>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}

const page = {
  padding: '40px',

  maxWidth: '1100px',

  margin: 'auto',
};

const hero = {
  background: 'linear-gradient(135deg,#08111F,#D6A84F)',

  color: '#fff',

  padding: '40px',

  borderRadius: '24px',
};

const grid = {
  display: 'grid',

  gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))',

  gap: '25px',

  marginTop: '35px',
};

const link = {
  textDecoration: 'none',

  color: 'inherit',
};

const cardStyle = {
  background: '#fff',

  padding: '30px',

  borderRadius: '22px',

  boxShadow: '0 10px 30px rgba(0,0,0,.08)',

  height: '100%',
};
