export const metadata = {
  title: 'Contact & Support | Neighbour™',
  description: 'Contact and support information for Neighbour™.',
};

export default function ContactPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#FAF7F2',
        padding: '64px 24px 96px',
        color: '#102019',
      }}
    >
      <article
        style={{
          maxWidth: '760px',
          margin: '0 auto',
          background: '#FFFFFF',
          border: '1px solid #D8E4DC',
          borderRadius: '28px',
          padding: 'clamp(28px, 5vw, 56px)',
          lineHeight: 1.7,
        }}
      >
        <p style={{ color: '#0E5B3A', fontWeight: 800, margin: 0 }}>NEIGHBOUR™</p>
        <h1 style={{ fontSize: '42px', margin: '8px 0 8px' }}>Contact & Support</h1>

        <p>
          For Neighbour account, safety, privacy, marketplace or general support enquiries,
          contact:
        </p>

        <p style={{ fontSize: '20px', fontWeight: 800 }}>
          <a href="mailto:csscpsg.enquiries@csscpsg.co.uk">
            csscpsg.enquiries@csscpsg.co.uk
          </a>
        </p>

        <p>Operator: : Jason-Paul : Greaves</p>

        <h2 style={{ marginTop: '34px' }}>Safety concerns</h2>
        <p>
          Where possible, use Neighbour's built-in reporting and blocking features for content,
          accounts, messages, marketplace activity or other community-safety concerns. You may
          also contact us using the email address above.
        </p>

        <h2 style={{ marginTop: '34px' }}>Privacy enquiries</h2>
        <p>
          Privacy and account-information enquiries can be sent to the same support address.
        </p>

        <h2 style={{ marginTop: '34px' }}>Legal information</h2>
        <p>
          <a href="/privacy">Privacy Policy</a>
          {' · '}
          <a href="/terms">Terms of Use</a>
        </p>
      </article>
    </main>
  );
}
