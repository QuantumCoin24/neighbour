'use client';

import { useState } from 'react';
import { saveTokens } from '../../lib/auth';
import { registerUser, loginUser } from '@neighbour/api-client';

export default function AuthPage() {
  const [mode, setMode] = useState<'register' | 'login'>('register');

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [message, setMessage] = useState('');

  async function handleSubmit() {
    try {
      setMessage(mode === 'register' ? 'Creating your Neighbour™ account...' : 'Signing you in...');

      const response =
        mode === 'register'
          ? await registerUser({
              displayName,
              email,
              password,
            })
          : await loginUser({
              email,
              password,
            });

      saveTokens(response.accessToken, response.refreshToken);

      if (mode === 'register') {
        window.location.href = '/profile/setup';
      } else {
        window.location.href = '/home';
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Authentication failed.');
    }
  }

  return (
    <main style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={{ textAlign: 'center' }}>NEIGHBOUR™</h1>

        <h2 style={{ textAlign: 'center' }}>
          {mode === 'register' ? 'Create your account' : 'Welcome back'}
        </h2>

        {mode === 'register' && (
          <input
            placeholder="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            style={inputStyle}
          />
        )}

        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        <button onClick={handleSubmit} style={buttonStyle}>
          {mode === 'register' ? 'Join Neighbour™' : 'Sign In'}
        </button>

        <button
          onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
          style={switchStyle}
        >
          {mode === 'register' ? 'Already have an account? Sign In' : 'Create a new account'}
        </button>

        {message && (
          <p
            style={{
              marginTop: '20px',
              textAlign: 'center',
            }}
          >
            {message}
          </p>
        )}
      </div>
    </main>
  );
}

const pageStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'Arial, sans-serif',
  background: 'linear-gradient(135deg,#f5f9ff,#ffffff)',
};

const cardStyle = {
  width: '420px',
  padding: '40px',
  borderRadius: '20px',
  background: '#fff',
  boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
};

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

const switchStyle = {
  width: '100%',
  padding: '14px',
  marginTop: '15px',
  borderRadius: '10px',
  border: '1px solid #ddd',
  background: '#fff',
  fontSize: '16px',
  cursor: 'pointer',
};
