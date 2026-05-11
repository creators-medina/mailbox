'use client';

import { useState, FormEvent } from 'react';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Tiles';
import { createClient } from '@/lib/supabase/client';

type Mode = 'login' | 'signup' | 'reset';

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    const supabase = createClient();

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = '/account';
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/account` },
        });
        if (error) throw error;
        setStatus('success');
        setMessage('Check your email to confirm your account.');
        return;
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/account`,
        });
        if (error) throw error;
        setStatus('success');
        setMessage('Password reset link sent — check your email.');
        return;
      }
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  const heading =
    mode === 'login' ? 'Sign in to your account' :
    mode === 'signup' ? 'Create your account' :
    'Reset your password';

  return (
    <>
      <Nav />
      <section
        className="w-section dark"
        style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: 80 }}
      >
        <div className="w-section-inner" style={{ maxWidth: 440 }}>
          <div className="w-hero-eyebrow" style={{ marginBottom: 10 }}>My Biz Address</div>
          <h1 className="w-hero-title" style={{ fontSize: 36, marginBottom: 36 }}>
            {heading}
          </h1>

          {status === 'success' ? (
            <div style={{
              background: 'rgba(184,135,70,0.10)',
              border: '1px solid rgba(184,135,70,0.25)',
              borderRadius: 12, padding: '20px 22px',
            }}>
              <p style={{ font: '500 15px/1.6 var(--font-text,sans-serif)', color: 'var(--c-gold-2,#C99A5A)', margin: 0 }}>
                {message}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="ds-field">
                <label className="ds-dark-label" htmlFor="l-email">Email address</label>
                <input
                  id="l-email" className="ds-dark-input" type="email"
                  placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  required autoComplete="email"
                />
              </div>

              {mode !== 'reset' && (
                <div className="ds-field" style={{ marginBottom: 24 }}>
                  <label className="ds-dark-label" htmlFor="l-pass">Password</label>
                  <input
                    id="l-pass" className="ds-dark-input" type="password"
                    placeholder={mode === 'signup' ? 'Create a password' : 'Your password'}
                    value={password} onChange={e => setPassword(e.target.value)}
                    required minLength={8}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  />
                </div>
              )}

              {status === 'error' && (
                <p style={{
                  font: '400 13px/1.4 var(--font-text,sans-serif)',
                  color: '#f87171', marginBottom: 16,
                }}>
                  {message}
                </p>
              )}

              <button
                className="w-cta-pill filled"
                type="submit"
                disabled={status === 'loading'}
                style={{ border: 'none', cursor: status === 'loading' ? 'default' : 'pointer', width: '100%', justifyContent: 'center', marginBottom: 20 }}
              >
                {status === 'loading' ? 'Please wait…' :
                 mode === 'login' ? 'Sign in' :
                 mode === 'signup' ? 'Create account' :
                 'Send reset link'}
              </button>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
                {mode === 'login' && (
                  <>
                    <button type="button" className="auth-text-link"
                      onClick={() => { setMode('reset'); setMessage(''); setStatus('idle'); }}>
                      Forgot your password?
                    </button>
                    <span style={{ font: '400 13px/1 var(--font-text,sans-serif)', color: 'var(--c-text-3)' }}>
                      Don&rsquo;t have an account?{' '}
                      <button type="button" className="auth-text-link"
                        onClick={() => { setMode('signup'); setMessage(''); setStatus('idle'); }}>
                        Sign up
                      </button>
                    </span>
                  </>
                )}
                {mode === 'signup' && (
                  <span style={{ font: '400 13px/1 var(--font-text,sans-serif)', color: 'var(--c-text-3)' }}>
                    Already have an account?{' '}
                    <button type="button" className="auth-text-link"
                      onClick={() => { setMode('login'); setMessage(''); setStatus('idle'); }}>
                      Sign in
                    </button>
                  </span>
                )}
                {mode === 'reset' && (
                  <button type="button" className="auth-text-link"
                    onClick={() => { setMode('login'); setMessage(''); setStatus('idle'); }}>
                    Back to sign in
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}
