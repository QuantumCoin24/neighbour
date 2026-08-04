'use client';

import { useState } from 'react';
import { updateMyProfile } from '@neighbour/api-client';

export default function ProfileSetupPage() {
  const [username, setUsername] = useState('');

  const [localArea, setLocalArea] = useState('');

  const [bio, setBio] = useState('');

  const [message, setMessage] = useState('');

  async function saveProfile() {
    try {
      setMessage('Saving your profile...');

      const token = localStorage.getItem('accessToken');

      if (!token) {
        setMessage('No active session.');

        return;
      }

      await updateMyProfile(
        {
          username,
          localArea,
          bio,
        },
        token,
      );

      setMessage('Profile saved successfully.');

      setTimeout(() => {
        window.location.href = '/home';
      }, 800);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Profile save failed.');
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg,#f5f9ff,#ffffff)',
      }}
    >
      <div
        style={{
          width: '450px',
          padding: '40px',
          background: '#fff',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
        }}
      >
        <h1
          style={{
            textAlign: 'center',
          }}
        >
          Neighbour™
        </h1>

        <h2
          style={{
            textAlign: 'center',
          }}
        >
          Complete your profile
        </h2>

        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={inputStyle}
        />

        <input
          placeholder="Your local area"
          value={localArea}
          onChange={(e) => setLocalArea(e.target.value)}
          style={inputStyle}
        />

        <textarea
          placeholder="Tell your neighbours about yourself"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          style={{
            ...inputStyle,
            height: '120px',
          }}
        />

        <button onClick={saveProfile} style={buttonStyle}>
          Enter Neighbour™
        </button>

        {message && (
          <p
            style={{
              textAlign: 'center',
              marginTop: '20px',
            }}
          >
            {message}
          </p>
        )}
      </div>
    </main>
  );
}

const inputStyle = {
  width: '100%',
  padding: '14px',
  marginTop: '15px',
  borderRadius: '10px',
  border: '1px solid #ddd',
  fontSize: '16px',
};

const buttonStyle = {
  width: '100%',
  padding: '14px',
  marginTop: '25px',
  borderRadius: '10px',
  border: 'none',
  background: '#111',
  color: '#fff',
  fontSize: '16px',
  cursor: 'pointer',
};
