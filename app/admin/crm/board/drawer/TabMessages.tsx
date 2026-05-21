'use client';

import { useEffect, useMemo, useState } from 'react';
import type {
  Channel,
  Conversation,
  DeliveryStatus,
  Direction,
  Lead,
  Message,
  MessageTemplate,
  StaffUser,
} from '@/lib/crm/types';
import { relativeTime } from '@/lib/crm/format';
import { buildLeadVars, renderTemplate } from '@/lib/crm/template-vars';
import Avatar from '../Avatar';

const DEFAULT_SUBJECT = 'Re: Your My Biz Address inquiry';

const CHANNEL_LABEL: Record<Channel, string> = {
  email: 'Email',
  sms: 'SMS',
  phone: 'Call',
  internal: 'Note',
  system: 'System',
};

const CHANNEL_ICON: Record<Channel, string> = {
  email: '✉',
  sms: '✉',
  phone: '☎',
  internal: '◉',
  system: '⚙',
};

const DIRECTION_LABEL: Record<Direction, string> = {
  inbound: 'in',
  outbound: 'out',
  internal: 'internal',
  system: 'system',
};

const STATUS_TONE: Record<DeliveryStatus, string> = {
  draft: 'var(--c-text-3)',
  queued: '#94A3B8',
  sent: '#3B82F6',
  delivered: '#10B981',
  failed: '#EF4444',
  bounced: '#EF4444',
  opened: '#10B981',
  clicked: '#10B981',
  received: '#3B82F6',
};

type Bundle = {
  conversations: Conversation[];
  messages: Message[];
};

export default function TabMessages({
  lead,
  staff,
  refreshKey,
  onActivityChange,
  onFlash,
}: {
  lead: Lead;
  staff: StaffUser[];
  refreshKey: number;
  onActivityChange: () => void;
  onFlash: (tone: 'ok' | 'err', text: string) => void;
}) {
  const leadId = lead.id;
  const leadEmail = lead.email;
  const [data, setData] = useState<Bundle | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [localNonce, setLocalNonce] = useState(0);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);

  // Active email templates for the picker.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/crm/templates?channel=email&active=1')
      .then(async (res) => {
        if (!res.ok) return;
        const j = (await res.json()) as { templates: MessageTemplate[] };
        if (!cancelled) setTemplates(j.templates);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const leadVars = useMemo(() => buildLeadVars(lead), [lead]);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setLoadErr(null);
    fetch(`/api/admin/crm/leads/${leadId}/messages`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load messages');
        const j = (await res.json()) as Bundle;
        if (!cancelled) setData(j);
      })
      .catch((e: unknown) => {
        if (!cancelled) setLoadErr(e instanceof Error ? e.message : 'Failed to load');
      });
    return () => {
      cancelled = true;
    };
  }, [leadId, refreshKey, localNonce]);

  // Group messages by conversation so the thread is grouped visually.
  const grouped = useMemo(() => {
    if (!data) return null;
    const map = new Map<string, Message[]>();
    for (const c of data.conversations) map.set(c.id, []);
    for (const m of data.messages) {
      if (!map.has(m.conversation_id)) map.set(m.conversation_id, []);
      map.get(m.conversation_id)!.push(m);
    }
    return data.conversations.map((c) => ({
      conversation: c,
      messages: map.get(c.id) ?? [],
    }));
  }, [data]);

  const existingEmailSubject = useMemo(() => {
    if (!data) return null;
    const emailConv = data.conversations
      .filter((c) => c.channel === 'email' && c.status === 'open' && c.subject)
      .sort((a, b) => (b.last_message_at ?? '').localeCompare(a.last_message_at ?? ''))[0];
    return emailConv?.subject ?? null;
  }, [data]);

  if (loadErr) {
    return (
      <p style={{ color: '#fca5a5', font: '400 12px/1.4 var(--font-text,sans-serif)' }}>
        {loadErr}
      </p>
    );
  }

  return (
    <div>
      {data === null ? (
        <Skeleton />
      ) : data.messages.length === 0 ? (
        <Empty />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {grouped!.map(({ conversation, messages }) => (
            <ConversationBlock
              key={conversation.id}
              conversation={conversation}
              messages={messages}
              staff={staff}
            />
          ))}
        </div>
      )}

      <EmailComposer
        leadId={leadId}
        leadEmail={leadEmail}
        defaultSubject={existingEmailSubject ?? DEFAULT_SUBJECT}
        templates={templates}
        leadVars={leadVars}
        onSent={() => {
          setLocalNonce((n) => n + 1);
          onActivityChange();
          onFlash('ok', 'Email sent.');
        }}
        onFail={(msg) => onFlash('err', msg)}
      />
    </div>
  );
}

function ConversationBlock({
  conversation,
  messages,
  staff,
}: {
  conversation: Conversation;
  messages: Message[];
  staff: StaffUser[];
}) {
  return (
    <section
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--c-border,rgba(255,255,255,0.07))',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: '10px 12px',
          borderBottom: '1px solid var(--c-border,rgba(255,255,255,0.07))',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        <span
          aria-hidden
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            font: '600 12px/1 var(--font-display,sans-serif)',
            color: 'var(--c-text-2)',
          }}
        >
          {CHANNEL_ICON[conversation.channel]}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              font: '600 13px/1.2 var(--font-display,sans-serif)',
              color: '#fff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {conversation.subject || `${CHANNEL_LABEL[conversation.channel]} thread`}
          </div>
          <div
            style={{
              font: '400 11px/1.2 var(--font-text,sans-serif)',
              color: 'var(--c-text-3)',
              marginTop: 2,
            }}
          >
            {CHANNEL_LABEL[conversation.channel]} · {conversation.status} ·{' '}
            {messages.length} {messages.length === 1 ? 'message' : 'messages'}
          </div>
        </div>
      </header>

      <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {messages.length === 0 ? (
          <li
            style={{
              padding: 12,
              color: 'var(--c-text-3)',
              font: '400 12px/1.4 var(--font-text,sans-serif)',
            }}
          >
            No messages in this thread yet.
          </li>
        ) : (
          messages.map((m) => <MessageRow key={m.id} message={m} staff={staff} />)
        )}
      </ol>
    </section>
  );
}

function MessageRow({ message, staff }: { message: Message; staff: StaffUser[] }) {
  const sender = staff.find((s) => s.id === message.sent_by);
  const inbound = message.direction === 'inbound';

  return (
    <li
      style={{
        padding: '10px 12px',
        borderTop: '1px solid var(--c-border,rgba(255,255,255,0.05))',
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
        background: inbound ? 'rgba(59,130,246,0.04)' : 'transparent',
      }}
    >
      <Avatar
        userId={message.sent_by}
        name={sender?.full_name}
        email={inbound ? message.from_address : sender?.email}
        size={26}
        title={inbound ? message.from_address || 'Inbound' : sender?.full_name || sender?.email || 'Staff'}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            marginBottom: 4,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ font: '600 12px/1.2 var(--font-display,sans-serif)', color: '#fff' }}>
            {inbound ? message.from_address || 'Inbound' : sender?.full_name || sender?.email || 'Staff'}
          </span>
          <span
            style={{
              font: '500 9px/1 var(--font-text,sans-serif)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              background: 'rgba(255,255,255,0.06)',
              color: 'var(--c-text-2)',
              padding: '2px 6px',
              borderRadius: 999,
            }}
          >
            {DIRECTION_LABEL[message.direction]}
          </span>
          <span
            style={{
              font: '500 9px/1 var(--font-text,sans-serif)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: STATUS_TONE[message.delivery_status],
            }}
          >
            {message.delivery_status}
          </span>
          <span
            style={{
              marginLeft: 'auto',
              font: '400 11px/1 var(--font-text,sans-serif)',
              color: 'var(--c-text-3)',
            }}
            title={new Date(message.created_at).toLocaleString()}
          >
            {relativeTime(message.created_at)}
          </span>
        </div>

        {message.subject && message.channel === 'email' && (
          <div
            style={{
              font: '500 12px/1.4 var(--font-text,sans-serif)',
              color: 'var(--c-text-2)',
              marginBottom: 4,
            }}
          >
            {message.subject}
          </div>
        )}

        {message.body && (
          <div
            style={{
              font: '400 13px/1.55 var(--font-text,sans-serif)',
              color: 'var(--c-text-2)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {message.body}
          </div>
        )}

        {message.error_message && (
          <div
            role="alert"
            style={{
              marginTop: 6,
              font: '400 11px/1.4 var(--font-text,sans-serif)',
              color: '#fca5a5',
            }}
          >
            {message.error_message}
          </div>
        )}
      </div>
    </li>
  );
}

function EmailComposer({
  leadId,
  leadEmail,
  defaultSubject,
  templates,
  leadVars,
  onSent,
  onFail,
}: {
  leadId: string;
  leadEmail: string | null;
  defaultSubject: string;
  templates: MessageTemplate[];
  leadVars: Record<string, string>;
  onSent: () => void;
  onFail: (msg: string) => void;
}) {
  const [subject, setSubject] = useState(defaultSubject);
  const [bodyText, setBodyText] = useState('');
  const [busy, setBusy] = useState(false);
  const [localErr, setLocalErr] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState('');

  // Refresh the default subject if a different conversation arrives.
  useEffect(() => {
    setSubject(defaultSubject);
  }, [defaultSubject]);

  // Apply a template: resolve {{variables}} against this lead, then drop the
  // result into subject + body. Staff can still edit before sending.
  function applyTemplate(id: string) {
    setTemplateId(id);
    setLocalErr(null);
    if (!id) return;
    const tpl = templates.find((t) => t.id === id);
    if (!tpl) return;

    const renderedSubject = renderTemplate(tpl.subject, leadVars);
    const renderedBody = renderTemplate(tpl.body, leadVars);

    if (tpl.subject) setSubject(renderedSubject);
    setBodyText(renderedBody);

    // Defensive: a template with an empty body (e.g. created via raw SQL) or
    // one whose entire body was unresolved variables would produce nothing.
    if (renderedBody.trim().length === 0) {
      setLocalErr(
        `Template "${tpl.name}" has no usable body text. Edit it in CRM Templates before sending.`,
      );
    }
  }

  const canSend = !!leadEmail && subject.trim().length > 0 && bodyText.trim().length > 0 && !busy;

  async function send() {
    if (!canSend) return;
    setBusy(true);
    setLocalErr(null);
    const res = await fetch(`/api/admin/crm/leads/${leadId}/messages/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: subject.trim(), body: bodyText.trim() }),
    });
    setBusy(false);
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    if (!res.ok) {
      const msg = data?.error || 'Could not send the email.';
      setLocalErr(msg);
      onFail(msg);
      return;
    }
    setBodyText('');
    onSent();
  }

  return (
    <div
      style={{
        marginTop: 20,
        padding: 14,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--c-border,rgba(255,255,255,0.07))',
        borderRadius: 8,
      }}
    >
      <div
        style={{
          font: '600 12px/1.2 var(--font-display,sans-serif)',
          color: '#fff',
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span aria-hidden>✉</span>
        New email
        {leadEmail ? (
          <span
            style={{
              font: '400 11px/1 var(--font-text,sans-serif)',
              color: 'var(--c-text-3)',
              marginLeft: 'auto',
            }}
          >
            To: {leadEmail}
          </span>
        ) : null}
      </div>

      {!leadEmail && (
        <p
          style={{
            font: '400 11px/1.4 var(--font-text,sans-serif)',
            color: '#fca5a5',
            margin: '0 0 8px',
          }}
        >
          This lead has no email on file — edit the Overview tab to add one before sending.
        </p>
      )}

      {templates.length > 0 && (
        <select
          className="admin-select"
          value={templateId}
          onChange={(e) => applyTemplate(e.target.value)}
          disabled={!leadEmail || busy}
          aria-label="Insert template"
          style={{ width: '100%', marginBottom: 8 }}
        >
          <option value="">Insert a template…</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      )}

      <input
        className="admin-search-input"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Subject"
        aria-label="Subject"
        disabled={!leadEmail || busy}
        style={{ width: '100%', marginBottom: 8 }}
      />
      <textarea
        rows={5}
        className="admin-search-input"
        value={bodyText}
        onChange={(e) => setBodyText(e.target.value)}
        placeholder="Write your message…"
        aria-label="Message body"
        disabled={!leadEmail || busy}
        style={{ width: '100%', resize: 'vertical', marginBottom: 10 }}
      />

      {localErr && (
        <p
          role="alert"
          style={{
            font: '400 11px/1.4 var(--font-text,sans-serif)',
            color: '#fca5a5',
            margin: '0 0 8px',
          }}
        >
          {localErr}
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            font: '400 11px/1.4 var(--font-text,sans-serif)',
            color: 'var(--c-text-3)',
          }}
        >
          Sent via Resend · plain text + auto HTML
        </span>
        <button
          onClick={send}
          disabled={!canSend}
          className="w-cta-pill filled"
          style={{
            border: 'none',
            padding: '8px 16px',
            cursor: canSend ? 'pointer' : 'not-allowed',
            opacity: canSend ? 1 : 0.5,
          }}
        >
          {busy ? 'Sending…' : 'Send email'}
        </button>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[0, 1].map((i) => (
        <div
          key={i}
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--c-border,rgba(255,255,255,0.07))',
            borderRadius: 8,
            padding: 12,
            height: 78,
          }}
        />
      ))}
    </div>
  );
}

function Empty() {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '28px 12px',
        border: '1px dashed var(--c-border,rgba(255,255,255,0.1))',
        borderRadius: 8,
        color: 'var(--c-text-3)',
      }}
    >
      <div
        aria-hidden
        style={{
          font: '600 22px/1 var(--font-display,sans-serif)',
          color: 'var(--c-text-2)',
          marginBottom: 6,
        }}
      >
        ✉
      </div>
      <p
        style={{
          font: '500 13px/1.3 var(--font-display,sans-serif)',
          color: 'var(--c-text-2)',
          margin: '0 0 4px',
        }}
      >
        No messages yet
      </p>
      <p style={{ font: '400 12px/1.5 var(--font-text,sans-serif)', margin: 0 }}>
        Use the composer below to send your first email.
      </p>
    </div>
  );
}
