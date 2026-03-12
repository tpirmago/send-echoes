import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type Mode = 'login' | 'register';

export function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/echoes';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setRegistered(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
            <span style={{ fontSize: 40 }}>✉️</span>
            <h2 style={headingStyle}>Check your inbox</h2>
            <p style={subtextStyle}>
              We sent a confirmation link to <strong>{email}</strong>. Click it to activate your
              account, then{' '}
              <button
                style={inlineLinkStyle}
                onClick={() => {
                  setRegistered(false);
                  setMode('login');
                }}
              >
                sign in
              </button>
              .
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <Link to="/" style={{ textDecoration: 'none', marginBottom: 32, display: 'block', textAlign: 'center' }}>
        <span style={{ fontSize: 17, fontWeight: 700, color: '#1a1a2e', letterSpacing: '-0.02em' }}>
          Send Echoes
        </span>
      </Link>

      <div style={cardStyle}>
        {/* Mode toggle */}
        <div style={tabRowStyle}>
          <button
            style={tabStyle(mode === 'login')}
            onClick={() => { setMode('login'); setError(null); }}
          >
            Sign in
          </button>
          <button
            style={tabStyle(mode === 'register')}
            onClick={() => { setMode('register'); setError(null); }}
          >
            Create account
          </button>
        </div>

        <h2 style={headingStyle}>
          {mode === 'login' ? 'Welcome back' : 'Start your journey'}
        </h2>
        <p style={subtextStyle}>
          {mode === 'login'
            ? 'Sign in to open your Echoes.'
            : 'Send messages to the future.'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              style={inputStyle}
            />
          </div>

          {error && (
            <p style={{ fontSize: 13, color: '#ef4444', margin: 0 }}>{error}</p>
          )}

          <button type="submit" disabled={loading} style={submitStyle}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px 16px',
};

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 24,
  boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
  padding: '36px 36px 40px',
  width: '100%',
  maxWidth: 420,
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
};

const tabRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 4,
  background: '#f3f4f6',
  borderRadius: 12,
  padding: 4,
};

const tabStyle = (active: boolean): React.CSSProperties => ({
  flex: 1,
  border: 'none',
  borderRadius: 9,
  padding: '8px 0',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s',
  background: active ? '#fff' : 'transparent',
  color: active ? '#1a1a2e' : '#6b7280',
  boxShadow: active ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
});

const headingStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  color: '#1a1a2e',
  letterSpacing: '-0.02em',
  margin: 0,
};

const subtextStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#6b7280',
  margin: 0,
  lineHeight: 1.5,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  color: '#374151',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1.5px solid #e5e7eb',
  borderRadius: 12,
  padding: '11px 14px',
  fontSize: 14,
  color: '#1a1a2e',
  background: '#fff',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const submitStyle: React.CSSProperties = {
  background: '#1a1a2e',
  color: '#fff',
  border: 'none',
  borderRadius: 12,
  padding: '13px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'opacity 0.15s',
  marginTop: 4,
};

const inlineLinkStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#8B5CF6',
  fontWeight: 600,
  cursor: 'pointer',
  padding: 0,
  fontSize: 'inherit',
  fontFamily: 'inherit',
};
