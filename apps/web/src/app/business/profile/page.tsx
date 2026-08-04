'use client';

import { useState } from 'react';
import { createBusiness } from '@neighbour/api-client';

export default function BusinessProfilePage() {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [communityId, setCommunityId] = useState('');
  const [message, setMessage] = useState('');

  async function save() {
    try {
      await createBusiness({
        communityId,

        name,

        description,

        category,
      });

      setMessage('Business profile created successfully.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Business creation failed.');
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
      <h1>Business Profile</h1>

      <p>Create and manage your Neighbour™ business identity.</p>

      <div
        style={{
          marginTop: '30px',
          display: 'grid',
          gap: '20px',
        }}
      >
        <input
          placeholder="Community ID"

          value={communityId}

          onChange={(e) => setCommunityId(e.target.value)}

          style={input}
        />

        <input
          placeholder="Business name"

          value={name}

          onChange={(e) => setName(e.target.value)}

          style={input}
        />

        <input
          placeholder="Category"

          value={category}

          onChange={(e) => setCategory(e.target.value)}

          style={input}
        />

        <textarea
          placeholder="Tell your community about your business"

          value={description}

          onChange={(e) => setDescription(e.target.value)}

          style={{
            ...input,
            height: '140px',
          }}
        />

        <button
          onClick={save}

          style={button}
        >
          Save Business Profile
        </button>

        {message && <p>{message}</p>}
      </div>
    </main>
  );
}

const input = {
  padding: '14px',
  borderRadius: '12px',
  border: '1px solid #ddd',
  fontSize: '16px',
};

const button = {
  padding: '15px',
  borderRadius: '12px',
  border: 'none',
  background: '#111',
  color: '#fff',
  fontSize: '16px',
  cursor: 'pointer',
};
