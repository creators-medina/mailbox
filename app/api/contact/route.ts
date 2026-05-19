import { Resend } from 'resend';

const DEFAULT_TO = 'isabelle@bomacnation.com';
const FROM_ADDRESS = 'My Biz Address <contact@mybizmailbox.biz>';

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(req: Request) {
  let payload: {
    name?: unknown;
    email?: unknown;
    phone?: unknown;
    message?: unknown;
  };

  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const email = typeof payload.email === 'string' ? payload.email.trim() : '';
  const phone = typeof payload.phone === 'string' ? payload.phone.trim() : '';
  const message = typeof payload.message === 'string' ? payload.message.trim() : '';

  if (!name || !email || !message) {
    return Response.json(
      { error: 'Name, email, and message are required.' },
      { status: 400 },
    );
  }

  if (!isValidEmail(email)) {
    return Response.json(
      { error: 'Please enter a valid email address.' },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[contact] RESEND_API_KEY is not configured');
    return Response.json(
      { error: 'Email service is not configured. Please try again later.' },
      { status: 500 },
    );
  }

  const to = process.env.CONTACT_TO_EMAIL || process.env.CONTACT_EMAIL || DEFAULT_TO;

  const resend = new Resend(apiKey);

  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    phone ? `Phone: ${phone}` : null,
    '',
    'Message:',
    message,
  ]
    .filter((line) => line !== null)
    .join('\n');

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      reply_to: email,
      subject: `New inquiry from ${name}`,
      text,
    });

    if (error) {
      console.error('[contact] Resend error:', error);
      return Response.json(
        { error: 'Could not send your message. Please try again or call us.' },
        { status: 502 },
      );
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error('[contact] Unexpected error:', err);
    return Response.json(
      { error: 'Could not send your message. Please try again or call us.' },
      { status: 500 },
    );
  }
}
