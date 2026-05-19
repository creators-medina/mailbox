// Tiny dependency-free markdown subset for comments and descriptions.
// Supports: **bold**, *italic*, `code`, line breaks, http(s)://… auto-links.
// HTML is escaped first so no untrusted content can produce a tag.

function escape(html: string): string {
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const URL_RE = /\b((?:https?:\/\/|www\.)[^\s<]+)/g;

export function renderMarkdown(input: string): string {
  let s = escape(input);

  // Auto-link URLs.
  s = s.replace(URL_RE, (m) => {
    const href = m.startsWith('http') ? m : `https://${m}`;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${m}</a>`;
  });

  // Inline code: `code`
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold: **text**
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italic: *text* — applied after bold so ** isn't consumed.
  s = s.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');

  // Paragraph breaks (\n\n) → </p><p>. Single \n → <br>.
  s = s
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('');

  return s;
}

export function initials(name: string | null | undefined, fallback = '?'): string {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/).slice(0, 2);
  if (parts.length === 0) return fallback;
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || fallback;
}

// Deterministic pastel-on-dark color from any id string (for avatar bgs).
export function hashColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  const hue = Math.abs(h) % 360;
  return `hsl(${hue}, 55%, 45%)`;
}

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}
