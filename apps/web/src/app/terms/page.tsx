export const metadata = {
  title: 'Terms of Use | Neighbour™',
  description: 'Terms governing use of Neighbour™.',
};

const sectionStyle = {
  marginTop: '32px',
} as const;

export default function TermsPage() {
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
          maxWidth: '820px',
          margin: '0 auto',
          background: '#FFFFFF',
          border: '1px solid #D8E4DC',
          borderRadius: '28px',
          padding: 'clamp(28px, 5vw, 56px)',
          lineHeight: 1.7,
        }}
      >
        <p style={{ color: '#0E5B3A', fontWeight: 800, margin: 0 }}>NEIGHBOUR™</p>
        <h1 style={{ fontSize: '42px', margin: '8px 0 8px' }}>Terms of Use</h1>
        <p style={{ color: '#516158', marginTop: 0 }}>Last updated: 30 August 2026</p>

        <p>
          These Terms govern your use of Neighbour™. Neighbour is operated by : Jason-Paul :
          Greaves. By creating an account or using Neighbour, you agree to these Terms.
        </p>

        <section style={sectionStyle}>
          <h2>Age requirement</h2>
          <p>
            You must be at least 16 years old to create or use a Neighbour account. By creating an
            account, you confirm that you are aged 16 or over.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>Your account</h2>
          <p>
            You are responsible for providing accurate account information, protecting your
            credentials and for activity conducted through your account. You must not impersonate
            another person or misuse another person's account.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>Community conduct</h2>
          <p>
            Neighbour is designed for constructive local participation. You must not use the
            service to threaten, harass, abuse or unlawfully discriminate against others, commit
            fraud, impersonate others, distribute unlawful material, exploit another person,
            promote violence, or publish content that violates another person's rights.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>User content</h2>
          <p>
            You remain responsible for content you submit. You must have the rights and
            permissions necessary to share it. By submitting content, you permit Neighbour to
            host, process and display that content as necessary to operate the features in which
            you chose to publish or share it.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>Moderation, reporting and blocking</h2>
          <p>
            Neighbour may use safety and moderation measures to protect users and the service.
            Users may be able to report content or accounts and block other users. We may review,
            restrict or remove content and may restrict or terminate accounts where reasonably
            necessary to enforce these Terms, respond to reports, protect users or comply with
            applicable law.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>Marketplace</h2>
          <p>
            Marketplace features allow users to interact regarding eligible goods or services.
            Users are responsible for the accuracy and legality of their listings and for
            complying with applicable law. Prohibited, fraudulent, misleading or abusive
            marketplace activity may be removed or restricted.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>Subscriptions and payments</h2>
          <p>
            Some Neighbour features may require payment or a subscription. Purchases made through
            an application platform are also subject to that platform's applicable payment and
            subscription terms. Prices, billing periods and renewal information are presented as
            part of the relevant purchase flow.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>Availability and changes</h2>
          <p>
            We may maintain, update or modify Neighbour as the service develops. We do not promise
            that every feature will always be available without interruption.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>Account restriction and termination</h2>
          <p>
            Access may be restricted or terminated where reasonably necessary because of serious
            or repeated violations of these Terms, unlawful activity, security threats, abuse of
            other users or misuse of the service.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>Privacy</h2>
          <p>
            Our Privacy Policy explains how information is handled when you use Neighbour.
          </p>
          <p>
            <a href="/privacy">Read the Neighbour Privacy Policy.</a>
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>Contact</h2>
          <p>
            Questions about these Terms can be sent to{' '}
            <a href="mailto:csscpsg.enquiries@csscpsg.co.uk">
              csscpsg.enquiries@csscpsg.co.uk
            </a>
            .
          </p>
        </section>
      </article>
    </main>
  );
}
