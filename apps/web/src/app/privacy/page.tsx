export const metadata = {
  title: 'Privacy Policy | Neighbour™',
  description: 'Privacy information for Neighbour™.',
};

const sectionStyle = {
  marginTop: '32px',
} as const;

export default function PrivacyPage() {
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
        <h1 style={{ fontSize: '42px', margin: '8px 0 8px' }}>Privacy Policy</h1>
        <p style={{ color: '#516158', marginTop: 0 }}>Last updated: 30 August 2026</p>

        <p>
          Neighbour™ is operated by : Jason-Paul : Greaves. This Privacy Policy explains how
          information is handled when you use the Neighbour website, mobile application and
          connected services.
        </p>

        <section style={sectionStyle}>
          <h2>Information we collect</h2>
          <p>
            Depending on the features you use, Neighbour may process account and profile
            information such as your name, email address, username, biography and profile image;
            location information such as your local area, postcode, city, region and coordinates;
            content you choose to create or share, including posts, comments, messages, photos,
            videos, listings and event information; customer-support communications; subscription
            and transaction records; and technical information required to operate features such
            as push notifications.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>How we use information</h2>
          <p>
            We use information to create and secure accounts, provide local community and
            discovery features, display and deliver content you choose to share, enable messaging,
            events, marketplace and subscription features, provide support, operate safety and
            moderation systems, prevent misuse, maintain the service and comply with applicable
            legal obligations.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>Location information</h2>
          <p>
            Neighbour may use location information to provide nearby communities, events,
            businesses and other local features. Where device location permission is requested,
            you can control that permission through your device settings.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>Photos, video, camera and microphone</h2>
          <p>
            When you choose features that require media, Neighbour may request access to your
            photo library, camera or microphone. These permissions are used to provide the feature
            you selected, such as sharing media or participating in live video or audio.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>Notifications</h2>
          <p>
            If you enable notifications, Neighbour processes the device information and push
            notification token required to deliver notifications to your device. Notification
            permissions can be changed through your device settings.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>Payments and subscriptions</h2>
          <p>
            Neighbour may use payment providers and platform payment services to process eligible
            purchases, subscriptions or marketplace transactions. Payment providers may process
            payment information under their own privacy terms. Neighbour may retain transaction
            and subscription records required to provide purchased services, administer
            transactions, prevent fraud and meet applicable legal or accounting obligations.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>Service providers</h2>
          <p>
            We may use service providers to operate infrastructure, databases, media storage,
            communications, live media, payments and other technical functions. Information is
            provided to service providers only as necessary for them to perform services for
            Neighbour, subject to applicable contractual and legal requirements.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>Safety, moderation and reports</h2>
          <p>
            Information associated with reports, blocked users, content and account activity may
            be processed where necessary to investigate reports, enforce Neighbour rules, protect
            users and maintain the safety and integrity of the service.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>Data retention</h2>
          <p>
            We retain personal information for as long as reasonably necessary to provide the
            service, maintain security, resolve disputes and satisfy applicable legal obligations.
            Retention periods may differ depending on the type of information and why it is held.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>Account deletion</h2>
          <p>
            You can request deletion directly through the account settings available in Neighbour.
            Personal account and profile information associated with the account will be removed
            in accordance with the deletion process. Certain records may be retained where
            required for legitimate security, transaction, dispute-resolution or legal purposes,
            including records that have been anonymised where appropriate.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>Your choices and rights</h2>
          <p>
            You can update certain account and profile information through Neighbour and control
            device permissions through your device settings. Depending on applicable law, you may
            also have rights relating to access, correction, deletion, restriction or objection
            concerning your personal information.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>Age requirement</h2>
          <p>
            Neighbour is intended for people aged 16 or over. People under 16 must not create a
            Neighbour account.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>Contact</h2>
          <p>
            Privacy enquiries can be sent to{' '}
            <a href="mailto:csscpsg.enquiries@csscpsg.co.uk">
              csscpsg.enquiries@csscpsg.co.uk
            </a>
            .
          </p>
          <p>Operator: : Jason-Paul : Greaves</p>
        </section>
      </article>
    </main>
  );
}
