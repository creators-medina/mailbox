'use client';
import { useState } from 'react';

export interface EligibleItem {
  id: string;
  sender: string | null;
  received_at: string;
}

const CARRIERS = ['No preference', 'USPS', 'FedEx', 'UPS', 'DHL', 'Other'] as const;
type Carrier = (typeof CARRIERS)[number];

interface Fields {
  destName: string;
  street:   string;
  city:     string;
  state:    string;
  postal:   string;
  country:  string;
  carrier:  Carrier;
  note:     string;
}

interface Errors {
  items?:    string;
  destName?: string;
  street?:   string;
  city?:     string;
  country?:  string;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const LABEL: React.CSSProperties = {
  display: 'block',
  font: '600 11px/1 var(--font-text,sans-serif)',
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: 'var(--c-text-3)',
  marginBottom: 6,
};

function fieldStyle(hasError: boolean): React.CSSProperties {
  return {
    display: 'block',
    width: '100%',
    padding: '9px 12px',
    borderRadius: 8,
    font: '400 14px/1.4 var(--font-text,sans-serif)',
    color: 'var(--c-text,#F8FAFC)',
    background: 'var(--c-surface,#162032)',
    border: `1px solid ${hasError ? '#f87171' : 'var(--c-border-2,rgba(255,255,255,0.14))'}`,
    outline: 'none',
    WebkitAppearance: 'none' as const,
    boxSizing: 'border-box' as const,
  };
}

const ERR: React.CSSProperties = {
  font: '400 12px/1.4 var(--font-text,sans-serif)',
  color: '#f87171',
  margin: '5px 0 0',
};

const DIVIDER: React.CSSProperties = {
  borderTop: '1px solid var(--c-border,rgba(255,255,255,0.07))',
  paddingTop: 20,
  marginBottom: 20,
};

const SECTION_LABEL: React.CSSProperties = {
  font: '600 11px/1 var(--font-text,sans-serif)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--c-text-3)',
  marginBottom: 12,
};

export default function ForwardingRequestForm({ items }: { items: EligibleItem[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [fields, setFields]     = useState<Fields>({
    destName: '', street: '', city: '', state: '',
    postal: '', country: '', carrier: 'No preference', note: '',
  });
  const [errors, setErrors]       = useState<Errors>({});
  const [isPending, setIsPending] = useState(false);
  const [serverError, setServerError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    if (errors.items) setErrors(e => ({ ...e, items: undefined }));
  }

  function setField(k: keyof Fields, v: string) {
    setFields(f => ({ ...f, [k]: v }));
    const errKey = k as keyof Errors;
    if (errors[errKey]) setErrors(e => ({ ...e, [errKey]: undefined }));
  }

  function validate(): boolean {
    const e: Errors = {};
    if (selected.size === 0)          e.items    = 'Select at least one mail item to forward.';
    if (!fields.destName.trim())      e.destName = 'Destination name is required.';
    if (!fields.street.trim())        e.street   = 'Street address is required.';
    if (!fields.city.trim())          e.city     = 'City is required.';
    if (!fields.country.trim())       e.country  = 'Country is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setIsPending(true);
    setServerError('');
    try {
      const res = await fetch('/api/forwarding-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mail_item_ids: Array.from(selected),
          dest_name:     fields.destName,
          street:        fields.street,
          city:          fields.city,
          state:         fields.state,
          postal:        fields.postal,
          country:       fields.country,
          carrier:       fields.carrier,
          note:          fields.note,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json() as { error?: string };
        setServerError(data.error ?? 'Something went wrong. Please try again.');
      }
    } catch {
      setServerError('Network error. Please check your connection and try again.');
    } finally {
      setIsPending(false);
    }
  }

  // ── Empty state ──────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="dash-card">
        <span className="dash-card-title">Request forwarding</span>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginTop: 16,
                      padding: '14px 16px', borderRadius: 10,
                      background: 'var(--c-surface,#162032)',
                      border: '1px solid var(--c-border,rgba(255,255,255,0.07))' }}>
          <svg viewBox="0 0 18 18" width="16" height="16" fill="none"
               stroke="var(--c-text-3)" strokeWidth="1.5"
               strokeLinecap="round" strokeLinejoin="round"
               style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="9" cy="9" r="8"/>
            <path d="M9 5v4M9 13h.01"/>
          </svg>
          <p style={{ font: '400 13px/1.6 var(--font-text,sans-serif)',
                      color: 'var(--c-text-3)', margin: 0 }}>
            No eligible mail items right now. Items that are already forwarded,
            shredded, picked up, or have an open forwarding request will not appear here.
          </p>
        </div>
      </div>
    );
  }

  // ── Success state ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="dash-card">
        <span className="dash-card-title">Request forwarding</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16,
                      padding: '14px 16px', borderRadius: 10,
                      background: 'rgba(74,222,128,0.06)',
                      border: '1px solid rgba(74,222,128,0.18)' }}>
          <svg viewBox="0 0 16 16" width="15" height="15" fill="none"
               stroke="#4ade80" strokeWidth="1.8"
               strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8l3.5 3.5L13 4.5"/>
          </svg>
          <div>
            <p style={{ font: '600 13px/1.3 var(--font-text,sans-serif)',
                        color: '#4ade80', margin: '0 0 2px' }}>
              Forwarding request submitted.
            </p>
            <p style={{ font: '400 12px/1.4 var(--font-text,sans-serif)',
                        color: 'var(--c-text-3)', margin: 0 }}>
              We&rsquo;ll prepare your shipment and notify you when it&rsquo;s on its way.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <div className="dash-card">
      <span className="dash-card-title">Request forwarding</span>

      <form onSubmit={handleSubmit} noValidate>

        {/* ── Item selection ─────────────────────────────────────────── */}
        <div style={{ marginTop: 16, marginBottom: 20 }}>
          <p style={SECTION_LABEL}>Select items to forward</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {items.map(item => {
              const checked = selected.has(item.id);
              return (
                <label
                  key={item.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    cursor: 'pointer', padding: '10px 12px', borderRadius: 8,
                    background: checked ? 'var(--c-surface-2,#1E2D42)' : 'var(--c-surface,#162032)',
                    border: `1px solid ${checked
                      ? 'rgba(181,138,82,0.28)'
                      : 'var(--c-border,rgba(255,255,255,0.07))'}`,
                    transition: 'background 100ms ease, border-color 100ms ease',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(item.id)}
                    style={{ accentColor: 'var(--c-gold,#B58A52)', width: 15, height: 15, flexShrink: 0 }}
                  />
                  <span style={{ font: '500 13px/1.3 var(--font-text,sans-serif)',
                                 color: 'rgba(255,255,255,0.88)', flex: 1, minWidth: 0 }}>
                    {item.sender ?? 'Unknown sender'}
                  </span>
                  <span style={{ font: '400 12px/1 var(--font-text,sans-serif)',
                                 color: 'var(--c-text-3)', flexShrink: 0 }}>
                    {fmtDate(item.received_at)}
                  </span>
                </label>
              );
            })}
          </div>
          {errors.items && <p style={ERR}>{errors.items}</p>}
        </div>

        {/* ── Forwarding destination ────────────────────────────────── */}
        <div style={DIVIDER}>
          <p style={SECTION_LABEL}>Forwarding destination</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            <div>
              <label style={LABEL}>Destination name *</label>
              <input
                type="text"
                value={fields.destName}
                onChange={e => setField('destName', e.target.value)}
                placeholder="Person or business name"
                style={fieldStyle(!!errors.destName)}
              />
              {errors.destName && <p style={ERR}>{errors.destName}</p>}
            </div>

            <div>
              <label style={LABEL}>Street address *</label>
              <input
                type="text"
                value={fields.street}
                onChange={e => setField('street', e.target.value)}
                placeholder="123 Main St, Apt 2B"
                style={fieldStyle(!!errors.street)}
              />
              {errors.street && <p style={ERR}>{errors.street}</p>}
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ flex: '2 1 160px' }}>
                <label style={LABEL}>City *</label>
                <input
                  type="text"
                  value={fields.city}
                  onChange={e => setField('city', e.target.value)}
                  placeholder="City"
                  style={fieldStyle(!!errors.city)}
                />
                {errors.city && <p style={ERR}>{errors.city}</p>}
              </div>
              <div style={{ flex: '1 1 80px' }}>
                <label style={LABEL}>State / Region</label>
                <input
                  type="text"
                  value={fields.state}
                  onChange={e => setField('state', e.target.value)}
                  placeholder="TX"
                  style={fieldStyle(false)}
                />
              </div>
              <div style={{ flex: '1 1 90px' }}>
                <label style={LABEL}>Postal code</label>
                <input
                  type="text"
                  value={fields.postal}
                  onChange={e => setField('postal', e.target.value)}
                  placeholder="75087"
                  style={fieldStyle(false)}
                />
              </div>
            </div>

            <div>
              <label style={LABEL}>Country *</label>
              <input
                type="text"
                value={fields.country}
                onChange={e => setField('country', e.target.value)}
                placeholder="United States"
                style={fieldStyle(!!errors.country)}
              />
              {errors.country && <p style={ERR}>{errors.country}</p>}
            </div>
          </div>
        </div>

        {/* ── Preferred carrier ─────────────────────────────────────── */}
        <div style={DIVIDER}>
          <p style={SECTION_LABEL}>Preferred carrier</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CARRIERS.map(c => {
              const active = fields.carrier === c;
              return (
                <label
                  key={c}
                  style={{
                    display: 'inline-flex', alignItems: 'center',
                    padding: '6px 14px', borderRadius: 980, cursor: 'pointer',
                    font: '500 12px/1 var(--font-text,sans-serif)',
                    color:      active ? 'var(--c-bg,#071B2D)' : 'var(--c-text-2)',
                    background: active ? 'var(--c-gold,#B58A52)' : 'var(--c-surface-2,#1E2D42)',
                    border: `1px solid ${active
                      ? 'var(--c-gold,#B58A52)'
                      : 'var(--c-border,rgba(255,255,255,0.07))'}`,
                    transition: 'background 100ms, color 100ms, border-color 100ms',
                    userSelect: 'none',
                  }}
                >
                  <input
                    type="radio"
                    name="carrier"
                    value={c}
                    checked={active}
                    onChange={() => setField('carrier', c)}
                    style={{ display: 'none' }}
                  />
                  {c}
                </label>
              );
            })}
          </div>
        </div>

        {/* ── Note to staff ──────────────────────────────────────────── */}
        <div style={{ ...DIVIDER, marginBottom: 24 }}>
          <label style={LABEL}>
            Note to staff&nbsp;
            <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0,
                           color: 'var(--c-text-3)' }}>(optional)</span>
          </label>
          <textarea
            value={fields.note}
            onChange={e => setField('note', e.target.value)}
            placeholder="Any special instructions for this shipment…"
            rows={3}
            style={{ ...fieldStyle(false), resize: 'vertical', lineHeight: '1.55' }}
          />
        </div>

        {/* ── Server error ───────────────────────────────────────────── */}
        {serverError && (
          <p style={{ ...ERR, marginBottom: 14, font: '400 13px/1.5 var(--font-text,sans-serif)' }}>
            {serverError}
          </p>
        )}

        {/* ── Submit ─────────────────────────────────────────────────── */}
        <button
          type="submit"
          disabled={isPending}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '11px 22px', borderRadius: 980,
            font: '600 14px/1 var(--font-text,sans-serif)',
            color: 'var(--c-bg,#071B2D)',
            background: isPending ? 'var(--c-copper,#A66A3F)' : 'var(--c-gold,#B58A52)',
            border: `1.5px solid ${isPending ? 'var(--c-copper,#A66A3F)' : 'var(--c-gold,#B58A52)'}`,
            cursor: isPending ? 'not-allowed' : 'pointer',
            opacity: isPending ? 0.75 : 1,
            boxShadow: '0 2px 8px rgba(181,138,82,0.28)',
            transition: 'background 140ms ease, opacity 140ms ease',
          }}
        >
          {isPending ? 'Submitting…' : 'Submit forwarding request'}
        </button>

      </form>
    </div>
  );
}
