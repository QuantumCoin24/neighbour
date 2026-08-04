'use client';

export default function Navbar() {
  return (
    <nav
      style={{
        width: '100%',
        padding: '24px 50px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: '28px',
          fontWeight: 800,
        }}
      >
        NEIGHBOUR™
      </h2>

      <div
        style={{
          display: 'flex',
          gap: '20px',
        }}
      >
        <a href="/how-it-works">How It Works</a>

        <a href="/communities">Communities</a>

        <a href="/safety">Safety</a>

        <a href="/auth">Sign In</a>
      </div>
    </nav>
  );
}
