'use client';

import { useState, FormEvent } from 'react';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export default function ContactForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Request failed');
      setStatus('sent');
      setForm({ name: '', email: '', phone: '', message: '' });
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div style={{ padding: '32px 0' }}>
        <p style={{
          font: '700 20px/1.3 var(--font-display,sans-serif)',
          color: 'var(--c-light-text,#0d0d0d)', marginBottom: 8,
        }}>
          Message received.
        </p>
        <p style={{
          font: '400 15px/1.6 var(--font-text,sans-serif)',
          color: 'var(--c-light-text-2,#555)',
        }}>
          We&rsquo;ll get back to you within one business day.
        </p>
        <button
          className="w-cta-pill outline"
          style={{ marginTop: 20, cursor: 'pointer' }}
          onClick={() => setStatus('idle')}
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="ds-field">
        <label className="ds-label" htmlFor="c-name">Name</label>
        <input id="c-name" className="ds-input" type="text"
          placeholder="Your name" value={form.name} onChange={set('name')} required />
      </div>
      <div className="ds-field">
        <label className="ds-label" htmlFor="c-email">Email</label>
        <input id="c-email" className="ds-input" type="email"
          placeholder="you@example.com" value={form.email} onChange={set('email')} required />
      </div>
      <div className="ds-field">
        <label className="ds-label" htmlFor="c-phone">Phone (optional)</label>
        <input id="c-phone" className="ds-input" type="tel"
          placeholder="(469) 000-0000" value={form.phone} onChange={set('phone')} />
      </div>
      <div className="ds-field">
        <label className="ds-label" htmlFor="c-message">Message</label>
        <textarea id="c-message" className="ds-input" rows={5}
          placeholder="How can we help?" value={form.message}
          onChange={set('message')} required style={{ resize: 'vertical' }} />
      </div>
      {status === 'error' && (
        <p style={{ font: '400 13px/1.4 var(--font-text,sans-serif)', color: '#d00', marginBottom: 12 }}>
          Something went wrong. Please try again or call (469) 893-4120.
        </p>
      )}
      <button
        className="w-cta-pill filled"
        type="submit"
        disabled={status === 'sending'}
        style={{ border: 'none', cursor: status === 'sending' ? 'default' : 'pointer' }}
      >
        {status === 'sending' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}
