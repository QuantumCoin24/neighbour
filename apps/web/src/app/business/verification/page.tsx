'use client';

import { useState } from 'react';

import { submitBusinessVerification, getBusinessVerification } from '@neighbour/api-client';

export default function BusinessVerificationPage() {
  const [businessId, setBusinessId] = useState('');

  const [notes, setNotes] = useState('');

  const [status, setStatus] = useState('');

  const [message, setMessage] = useState('');

  async function checkStatus() {
    try {
      const result = await getBusinessVerification(businessId);

      if (result) {
        setStatus(result.status);
      } else {
        setStatus('NO VERIFICATION REQUEST');
      }
    } catch (error) {
      setMessage('Unable to load verification.');
    }
  }

  async function submit() {
    try {
      const result = await submitBusinessVerification(businessId, {
        notes,
      });

      setStatus(result.status);

      setMessage('Verification request submitted.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Submission failed.');
    }
  }

  return (
    <main
      style={{
        padding: '50px',
        maxWidth: '800px',
        margin: 'auto',
      }}
    >
      <h1>🛡️ Business Verification</h1>

      <p>Build trust with your local community.</p>

      <input
        placeholder="Business ID"

        value={businessId}

        onChange={(e) => setBusinessId(e.target.value)}

        style={input}
      />

      <textarea
        placeholder="Tell us about your business"

        value={notes}

        onChange={(e) => setNotes(e.target.value)}

        style={{
          ...input,
          height: '140px',
        }}
      />

      <button onClick={submit} style={button}>
        Submit Verification
      </button>

      <button onClick={checkStatus} style={button}>
        Check Status
      </button>

      {status && <h2>Status: {status}</h2>}

      {message && <p>{message}</p>}
    </main>
  );
}

const input = {
  width: '100%',
  padding: '14px',
  marginTop: '20px',
  borderRadius: '12px',
  border: '1px solid #ddd',
};

const button = {
  marginTop: '20px',
  marginRight: '10px',
  padding: '14px 20px',
  borderRadius: '12px',
  border: 'none',
  background: '#111',
  color: '#fff',
  cursor: 'pointer',
};
