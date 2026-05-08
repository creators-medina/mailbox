'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      style={{
        background: 'none',
        border: '1px solid var(--c-border-2,rgba(255,255,255,0.13))',
        borderRadius: 100,
        padding: '8px 18px',
        font: '500 13px/1 var(--font-text,sans-serif)',
        color: 'var(--c-text-2,rgba(255,255,255,0.60))',
        cursor: 'pointer',
        transition: 'border-color 130ms ease, color 130ms ease',
      }}
      onMouseEnter={e => {
        (e.target as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.30)';
        (e.target as HTMLButtonElement).style.color = '#fff';
      }}
      onMouseLeave={e => {
        (e.target as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.13)';
        (e.target as HTMLButtonElement).style.color = 'rgba(255,255,255,0.60)';
      }}
    >
      Sign out
    </button>
  );
}
