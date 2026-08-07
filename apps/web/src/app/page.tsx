import Link from 'next/link';

export default function LandingPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #FAF7F2 0%, #F3F8F5 52%, #EDF6F0 100%)',
        padding: '72px 28px 120px',
      }}
    >
      <div
        style={{
          maxWidth: '1180px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.05fr) minmax(340px, .95fr)',
          gap: '56px',
          alignItems: 'center',
        }}
      >
        <section>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 12px',
              borderRadius: '999px',
              background: '#E1F3E8',
              color: '#0E5B3A',
              fontWeight: 800,
              fontSize: '13px',
              marginBottom: '22px',
            }}
          >
            <span>●</span>
            Built for real local communities
          </div>

          <h1
            style={{
              margin: 0,
              maxWidth: '760px',
              fontSize: 'clamp(48px, 7vw, 88px)',
              lineHeight: 0.98,
              letterSpacing: '-4px',
              color: '#063F2A',
              fontWeight: 900,
            }}
          >
            Neighbour™
          </h1>

          <h2
            style={{
              margin: '18px 0 0',
              maxWidth: '720px',
              fontSize: 'clamp(27px, 4vw, 48px)',
              lineHeight: 1.05,
              letterSpacing: '-1.6px',
              color: '#102019',
              fontWeight: 800,
            }}
          >
            Stronger together.
            <br />
            Local forever.
          </h2>

          <p
            style={{
              maxWidth: '660px',
              marginTop: '24px',
              color: '#516158',
              fontSize: '19px',
              lineHeight: 1.7,
            }}
          >
            Connect with neighbours, discover nearby events and businesses, build trusted
            communities and keep everything local in one place.
          </p>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              marginTop: '32px',
            }}
          >
            <Link
              href="/home"
              style={{
                textDecoration: 'none',
                background: '#0E5B3A',
                color: '#FFFFFF',
                padding: '14px 22px',
                borderRadius: '18px',
                fontWeight: 800,
              }}
            >
              Open Neighbour
            </Link>

            <Link
              href="/community"
              style={{
                textDecoration: 'none',
                background: '#FFFFFF',
                color: '#0E5B3A',
                padding: '14px 22px',
                borderRadius: '18px',
                fontWeight: 800,
                border: '1px solid #D8E4DC',
              }}
            >
              Explore communities
            </Link>
          </div>
        </section>

        <section
          style={{
            background: '#063F2A',
            borderRadius: '36px',
            padding: '30px',
            color: '#FFFFFF',
            boxShadow: '0 28px 70px rgba(6,63,42,.18)',
          }}
        >
          <img
            src="/brand/neighbour-mark.svg"
            alt=""
            width={84}
            height={84}
            style={{
              borderRadius: '24px',
              marginBottom: '20px',
            }}
          />

          <div
            style={{
              fontSize: '15px',
              color: '#A7F3D0',
              fontWeight: 800,
              marginBottom: '8px',
            }}
          >
            YOUR LOCAL WORLD
          </div>

          <div
            style={{
              fontSize: '32px',
              fontWeight: 900,
              letterSpacing: '-1px',
              marginBottom: '22px',
            }}
          >
            Everything nearby.
            <br />
            Everything connected.
          </div>

          {[
            'Neighbourhood communities',
            'Nearby map & local discovery',
            'Events and projects',
            'Local businesses',
            'Marketplace',
            'Private messaging',
          ].map((item) => (
            <div
              key={item}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '11px',
                padding: '12px 0',
                borderTop: '1px solid rgba(255,255,255,.09)',
              }}
            >
              <span
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: '#22C55E',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#063F2A',
                  fontWeight: 900,
                }}
              >
                ✓
              </span>

              <span style={{ fontWeight: 700 }}>{item}</span>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
