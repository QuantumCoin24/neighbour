'use client';

import { useState } from 'react';

import { createBusinessOffer, getBusinessOffers, type BusinessOffer } from '@neighbour/api-client';

export default function BusinessOffersPage() {
  const [businessId, setBusinessId] = useState('');

  const [title, setTitle] = useState('');

  const [description, setDescription] = useState('');

  const [offers, setOffers] = useState<BusinessOffer[]>([]);

  const [message, setMessage] = useState('');

  async function load() {
    try {
      const result = await getBusinessOffers(businessId);

      setOffers(result);
    } catch {
      setMessage('Unable to load offers.');
    }
  }

  async function create() {
    try {
      const result = await createBusinessOffer(businessId, {
        title,
        description,
      });

      setOffers((prev) => [...prev, result]);

      setMessage('Offer created.');
    } catch {
      setMessage('Offer creation failed.');
    }
  }

  return (
    <main
      style={{
        padding: '50px',
        maxWidth: '900px',
        margin: 'auto',
      }}
    >
      <h1>💼 Business Offers</h1>

      <p>Create offers for your local community.</p>

      <input
        placeholder="Business ID"

        value={businessId}

        onChange={(e) => setBusinessId(e.target.value)}

        style={input}
      />

      <input
        placeholder="Offer title"

        value={title}

        onChange={(e) => setTitle(e.target.value)}

        style={input}
      />

      <textarea
        placeholder="Offer description"

        value={description}

        onChange={(e) => setDescription(e.target.value)}

        style={{
          ...input,
          height: '120px',
        }}
      />

      <button onClick={create} style={button}>
        Create Offer
      </button>

      <button onClick={load} style={button}>
        Load Offers
      </button>

      {message && <p>{message}</p>}

      <h2>Current Offers</h2>

      {offers.map((offer) => (
        <section
          key={offer.id}

          style={{
            padding: '20px',
            marginTop: '15px',
            background: '#fff',
            borderRadius: '15px',
          }}
        >
          <h3>{offer.title}</h3>

          <p>{offer.description}</p>

          <p>
            Active:
            {offer.active ? 'Yes' : 'No'}
          </p>
        </section>
      ))}
    </main>
  );
}

const input = {
  width: '100%',
  padding: '14px',
  marginTop: '15px',
  borderRadius: '12px',
  border: '1px solid #ddd',
};

const button = {
  padding: '14px 20px',
  marginTop: '20px',
  marginRight: '10px',
  borderRadius: '12px',
  border: 'none',
  background: '#111',
  color: '#fff',
  cursor: 'pointer',
};
