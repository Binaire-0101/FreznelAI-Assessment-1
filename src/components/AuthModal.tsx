import React, { useState } from 'react';
import { X, Lock, Mail, User, LogIn, UserPlus, Shield, AlertCircle } from 'lucide-react';
import { AuthService } from '../auth/AuthService';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const authService = AuthService.getInstance();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      let user: UserProfile;
      if (isSignUp) {
        if (!displayName.trim()) {
          throw new Error('Please enter your full name');
        }
        user = await authService.signUp(email, password, displayName);
      } else {
        user = await authService.signIn(email, password);
      }
      setLoading(false);
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'Authentication failed');
    }
  };

  const handleGuestLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const user = await authService.signInGuest();
      setLoading(false);
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setLoading(false);
      setErrorMsg('Guest sign-in failed');
    }
  };

  return (
    <div className="spectrum-Modal-backdrop" onClick={onClose}>
      <div className="spectrum-Dialog" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <span className="spectrum-Tag spectrum-Tag--blue">Firebase Auth</span>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginTop: '6px', color: 'var(--spectrum-global-color-gray-900)' }}>
              {isSignUp ? 'Create Spectrum Account' : 'Sign In to Spectrum'}
            </h2>
          </div>
          <button className="spectrum-Button spectrum-Button--quiet" onClick={onClose} style={{ padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--spectrum-global-color-gray-200)',
          borderRadius: 'var(--spectrum-border-radius)',
          padding: '4px',
          marginBottom: '20px'
        }}>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setErrorMsg(''); }}
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: 'var(--spectrum-border-radius)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: isSignUp ? 'var(--spectrum-global-color-100)' : 'transparent',
              color: isSignUp ? 'var(--spectrum-accent-color-300)' : 'var(--spectrum-global-color-700)',
              transition: 'all var(--spectrum-transition-fast)'
            }}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setErrorMsg(''); }}
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: 'var(--spectrum-border-radius)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: !isSignUp ? 'var(--spectrum-global-color-100)' : 'transparent',
              color: !isSignUp ? 'var(--spectrum-accent-color-300)' : 'var(--spectrum-global-color-700)',
              transition: 'all var(--spectrum-transition-fast)'
            }}
          >
            Sign In
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            backgroundColor: 'rgba(227, 72, 80, 0.15)',
            border: '1px solid var(--spectrum-semantic-negative)',
            borderRadius: 'var(--spectrum-border-radius)',
            color: 'var(--spectrum-semantic-negative)',
            fontSize: '13px',
            marginBottom: '16px'
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {isSignUp && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Full Name</label>
              <div className="spectrum-Textfield">
                <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--spectrum-global-color-600)' }} />
                <input
                  type="text"
                  required
                  placeholder="Himanshu Sharma"
                  className="spectrum-Textfield-input"
                  style={{ paddingLeft: '38px' }}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Email Address</label>
            <div className="spectrum-Textfield">
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--spectrum-global-color-600)' }} />
              <input
                type="email"
                required
                placeholder="developer@freznel.ai"
                className="spectrum-Textfield-input"
                style={{ paddingLeft: '38px' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Password</label>
            <div className="spectrum-Textfield">
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--spectrum-global-color-600)' }} />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                className="spectrum-Textfield-input"
                style={{ paddingLeft: '38px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="spectrum-Button spectrum-Button--accent"
            style={{ padding: '12px', fontSize: '14px', marginTop: '6px' }}
          >
            {isSignUp ? <UserPlus size={16} /> : <LogIn size={16} />}
            {loading ? 'Authenticating...' : isSignUp ? 'Sign Up with Firebase' : 'Sign In with Firebase'}
          </button>
        </form>

        <hr style={{ margin: '20px 0', borderColor: 'var(--spectrum-global-color-gray-300)', borderStyle: 'solid' }} />

        {/* Guest Login */}
        <button
          type="button"
          onClick={handleGuestLogin}
          disabled={loading}
          className="spectrum-Button spectrum-Button--secondary"
          style={{ width: '100%', padding: '10px', fontSize: '13px' }}
        >
          <Shield size={16} />
          Continue as Guest Developer
        </button>

      </div>
    </div>
  );
};
