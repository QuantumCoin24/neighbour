'use client';

import { useEffect, useState } from 'react';

import { getDiscoverOffers } from '@neighbour/api-client';

export default function OfferDiscoverPage() {
  const [offers, setOffers] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getDiscoverOffers();

        setOffers(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <main style={page}>
      <section style={hero}>
        <h1>🏷️ Neighbour™ Offers</h1>

        <p>Discover local offers from businesses in your community.</p>
      </section>

      {loading && <p>Loading offers...</p>}

      <section style={grid}>
        {offers.map((offer) => (
          <article
            key={offer.id}

            style={card}
          >
            <h2>{offer.title}</h2>

            <p>{offer.description}</p>

            <p>🟢 Active Offer</p>
          </article>
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

const card = {
  background: '#fff',

  padding: '30px',

  borderRadius: '22px',

  boxShadow: '0 10px 30px rgba(0,0,0,.08)',
};
