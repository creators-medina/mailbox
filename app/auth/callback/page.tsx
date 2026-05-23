'use client';

import { useEffect, useRef, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Phase = 'loading' | 'form' | 'saving' | 'success' | 'error';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [formErr, setFormErr] = useState('');
  const ran = useRef(false);

  // Resolve the recovery session from the URL exactly once on mount.
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const supabase = createClient();

    async function init() {
      try {
        const url = new URL(window.location.href);
        const hash = new URLSearchParams(url.hash.replace(/^#/, ''));

        // Surface Supabase errors carried in the query or hash (e.g. expired).
        const errDesc =
          url.searchParams.get('error_description') || hash.get('error_description');
        if (errDesc) {
          setErrorMsg(friendly(errDesc));
          setPhase('error');
          return;
        }

        const code = url.searchParams.get('code');
        const cameFromRecovery =
          !!code || url.hash.includes('access_token') || url.hash.includes('type=recovery');

        // PKCE/code flow → exchange for a session. (Hash/implicit flow is
        // auto-detected by the browser client.)
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setErrorMsg('This password setup link is invalid or has expired.');
            setPhase('error');
            return;
          }
        }

        const { data: { session } } = await supabase.auth.getSession();

        if (session && cameFromRecovery) {
          setPhase('form');
        } else if (session && !cameFromRecovery) {
          // Already signed in, not a recovery visit → go to the dashboard.
          router.replace('/account');
        } else {
          setErrorMsg('This password setup link is invalid or has expired.');
          setPhase('error');
        }
      } catch {
        setErrorMsg('Something went wrong opening this link. Please try again.');
        setPhase('error');
      }
    }

    // Catch the recovery session if the browser client resolves the URL hash
    // slightly after mount.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setPhase('form');
    });

    void init();
    return () => sub.subscription.unsubscribe();
  }, [router]);

  async function activate(e: FormEvent) {
    e.preventDefault();
    setFormErr('');
    if (password.length < 8) {
      setFormErr('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setFormErr('Passwords do not match.');
      return;
    }
    setPhase('saving');
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setFormErr(error.message || 'Could not set your password. Please try again.');
        setPhase('form');
        return;
      }
      setPhase('success');
      setTimeout(() => router.replace('/account'), 1800);
    } catch {
      setFormErr('Network error. Please check your connection and try again.');
      setPhase('form');
    }
  }

  return (
    <section
      className="w-section dark"
      style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 22px' }}
    >
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 26 }}>
          <span style={{
            width: 30, height: 30, borderRadius: 7,
            background: 'rgba(181,138,82,0.12)', border: '1.5px solid var(--c-gold,#B58A52)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            font: '700 11px/1 var(--font-display,sans-serif)', color: 'var(--c-gold,#B58A52)',
          }}>MB</span>
          <span style={{ font: '700 15px/1 var(--font-text,sans-serif)', color: 'rgba(248,250,252,0.9)' }}>
            My Biz Address
          </span>
        </div>

        <div
          className="dash-card"
          style={{
            background: 'var(--c-surface,#162032)',
            border: '1px solid var(--c-border-2,rgba(255,255,255,0.13))',
            borderRadius: 16, padding: '32px 28px',
          }}
        >
          {phase === 'loading' && (
            <Centered title="Verifying your link…" body="One moment while we open your secure setup link." />
          )}

          {phase === 'error' && (
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ font: '700 22px/1.25 var(--font-display,sans-serif)', color: '#fff', margin: '0 0 10px' }}>
                Link expired or invalid
              </h1>
              <p style={{ font: '400 14px/1.6 var(--font-text,sans-serif)', color: 'var(--c-text-2)', margin: '0 0 22px' }}>
                {errorMsg || 'This password setup link can no longer be used.'} You can request a fresh link from the sign-in page.
              </p>
              <a className="w-cta-pill filled" href="/login" style={{ display: 'inline-flex', border: 'none' }}>
                Go to sign in
              </a>
            </div>
          )}

          {phase === 'success' && (
            <Centered title="Account activated" body="Taking you to your dashboard…" />
          )}

          {(phase === 'form' || phase === 'saving') && (
            <>
              <h1 style={{ font: '700 24px/1.25 var(--font-display,sans-serif)', color: '#fff', margin: '0 0 6px' }}>
                Set Your Password
              </h1>
              <p style={{ font: '400 14px/1.6 var(--font-text,sans-serif)', color: 'var(--c-text-2)', margin: '0 0 22px' }}>
                Create a password to activate your account and access your dashboard.
              </p>

              <form onSubmit={activate}>
                <div className="ds-field">
                  <label className="ds-dark-label" htmlFor="pw">Password</label>
                  <input
                    id="pw" className="ds-dark-input" type="password"
                    placeholder="At least 8 characters"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    required minLength={8} autoComplete="new-password"
                    disabled={phase === 'saving'}
                  />
                </div>
                <div className="ds-field" style={{ marginBottom: 20 }}>
                  <label className="ds-dark-label" htmlFor="pw2">Confirm password</label>
                  <input
                    id="pw2" className="ds-dark-input" type="password"
                    placeholder="Re-enter your password"
                    value={confirm} onChange={(e) => setConfirm(e.target.value)}
                    required minLength={8} autoComplete="new-password"
                    disabled={phase === 'saving'}
                  />
                </div>

                {formErr && (
                  <p role="alert" style={{ font: '400 13px/1.4 var(--font-text,sans-serif)', color: '#f87171', margin: '0 0 16px' }}>
                    {formErr}
                  </p>
                )}

                <button
                  className="w-cta-pill filled" type="submit"
                  disabled={phase === 'saving'}
                  style={{ border: 'none', width: '100%', justifyContent: 'center', cursor: phase === 'saving' ? 'default' : 'pointer' }}
                >
                  {phase === 'saving' ? 'Activating…' : 'Activate Account'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function Centered({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <h1 style={{ font: '700 22px/1.25 var(--font-display,sans-serif)', color: '#fff', margin: '0 0 10px' }}>
        {title}
      </h1>
      <p style={{ font: '400 14px/1.6 var(--font-text,sans-serif)', color: 'var(--c-text-2)', margin: 0 }}>
        {body}
      </p>
    </div>
  );
}

function friendly(raw: string): string {
  const s = raw.toLowerCase();
  if (s.includes('expired')) return 'This link has expired.';
  if (s.includes('invalid')) return 'This link is invalid.';
  return raw;
}
