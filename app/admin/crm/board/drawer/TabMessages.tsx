'use client';

import { useEffect, useMemo, useState } from 'react';
import type {
  Channel,
  Conversation,
  DeliveryStatus,
  Direction,
  Message,
  StaffUser,
} from '@/lib/crm/types';
import { relativeTime } from '@/lib/crm/format';
import Avatar from '../Avatar';

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
  leadId,
  staff,
  refreshKey,
}: {
  leadId: string;
  staff: StaffUser[];
  refreshKey: number;
}) {
  const [data, setData] = useState<Bundle | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    fetch(`/api/admin/crm/leads/${leadId}/messages`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load messages');
        const j = (await res.json()) as Bundle;
        if (!cancelled) setData(j);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      });
    return () => {
      cancelled = true;
    };
  }, [leadId, refreshKey]);

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

  if (error) {
    return (
      <p style={{ color: '#fca5a5', font: '400 12px/1.4 var(--font-text,sans-serif)' }}>
        {error}
      </p>
    );
  }
  if (data === null) {
    return <Skeleton />;
  }

  const empty = data.messages.length === 0;

  return (
    <div>
      {empty ? (
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

      <Composer />
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
          messages.map((m) => (
            <MessageRow key={m.id} message={m} staff={staff} />
          ))
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
        title={
          inbound
            ? message.from_address || 'Inbound'
            : sender?.full_name || sender?.email || 'Staff'
        }
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
          <span
            style={{
              font: '600 12px/1.2 var(--font-display,sans-serif)',
              color: '#fff',
            }}
          >
            {inbound
              ? message.from_address || 'Inbound'
              : sender?.full_name || sender?.email || 'Staff'}
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

function Composer() {
  return (
    <div
      style={{
        marginTop: 20,
        padding: 14,
        background: 'rgba(255,255,255,0.02)',
        border: '1px dashed var(--c-border,rgba(255,255,255,0.12))',
        borderRadius: 8,
        textAlign: 'center',
      }}
    >
      <p
        style={{
          margin: 0,
          font: '500 12px/1.4 var(--font-text,sans-serif)',
          color: 'var(--c-text-2)',
        }}
      >
        Email and SMS sending will be added in CRM-5B.
      </p>
      <p
        style={{
          margin: '4px 0 10px',
          font: '400 11px/1.4 var(--font-text,sans-serif)',
          color: 'var(--c-text-3)',
        }}
      >
        The data layer below is provider-agnostic — sender adapters will
        write to the same conversations and messages tables.
      </p>
      <button
        type="button"
        disabled
        className="w-cta-pill filled"
        style={{
          border: 'none',
          padding: '8px 16px',
          opacity: 0.4,
          cursor: 'not-allowed',
        }}
      >
        Compose (coming soon)
      </button>
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
        Email, SMS, and call logs will appear here once a channel is wired up.
      </p>
    </div>
  );
}
