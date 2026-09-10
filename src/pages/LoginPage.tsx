/**
 * LoginPage Component providing minimal technical authentication.
 * Dark centered card on white/neutral background with Binaire Freznel branding.
 *
 * Binaire Freznel AI Assessment - Requirements #5, #6
 */

import React, { useState } from 'react';
import { Logo } from '../components/common/Logo';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, signup, loginAsGuest, loading, error, isFirebaseLive, clearError } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('engineer@binaire-freznel.ai');
  const [password, setPassword] = useState('password123');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      await signup(email, password).catch(() => {});
    } else {
      await login(email, password).catch(() => {});
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#111111',
          color: '#ffffff',
          borderRadius: '4px',
          border: '1px solid #262626',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
          padding: '36px 32px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Brand Logo & Title */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ marginBottom: '16px' }}>
            <Logo size="large" />
          </div>
          <h1 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 700, letterSpacing: '-0.01em' }}>
            Model Selection Utility
          </h1>
          <p style={{ margin: 0, fontSize: '12px', color: '#999999', lineHeight: 1.4 }}>
            AI Infrastructure & Frontier Model Registry
          </p>
          <div
            style={{
              marginTop: '10px',
              fontSize: '10px',
              padding: '2px 8px',
              borderRadius: '10px',
              backgroundColor: isFirebaseLive ? '#14532d' : '#27272a',
              color: isFirebaseLive ? '#86efac' : '#a1a1aa',
              border: `1px solid ${isFirebaseLive ? '#166534' : '#3f3f46'}`,
            }}
          >
            {isFirebaseLive ? '● Live Firebase Authentication' : '● Developer Session Sandbox'}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div
            style={{
              backgroundColor: '#450a0a',
              border: '1px solid #7f1d1d',
              color: '#fca5a5',
              padding: '10px 12px',
              borderRadius: '3px',
              fontSize: '12px',
              marginBottom: '18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={clearError}
              style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label
              htmlFor="email-input"
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#aaaaaa',
                marginBottom: '6px',
              }}
            >
              Email Address
            </label>
            <input
              id="email-input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@organization.com"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '13px',
                backgroundColor: '#1c1c1c',
                border: '1px solid #333333',
                borderRadius: '3px',
                color: '#ffffff',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="password-input"
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#aaaaaa',
                marginBottom: '6px',
              }}
            >
              Password
            </label>
            <input
              id="password-input"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '13px',
                backgroundColor: '#1c1c1c',
                border: '1px solid #333333',
                borderRadius: '3px',
                color: '#ffffff',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '11px',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: '#ffffff',
              color: '#111111',
              border: 'none',
              borderRadius: '3px',
              cursor: loading ? 'wait' : 'pointer',
              marginTop: '6px',
              transition: 'opacity 150ms ease',
            }}
          >
            {loading ? 'Authenticating...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {/* Quick Demo Access for Evaluators */}
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={loginAsGuest}
            style={{
              width: '100%',
              padding: '9px',
              fontSize: '12px',
              backgroundColor: '#1f1f1f',
              color: '#cccccc',
              border: '1px solid #333333',
              borderRadius: '3px',
              cursor: 'pointer',
            }}
          >
            Instant Demo Access (Lead Assessor)
          </button>

          <button
            type="button"
            onClick={() => {
              clearError();
              setIsSignUp(!isSignUp);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#888888',
              fontSize: '12px',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            {isSignUp ? 'Already have an account? Sign In' : 'New engineer? Create account'}
          </button>
        </div>
      </div>
    </div>
  );
};
