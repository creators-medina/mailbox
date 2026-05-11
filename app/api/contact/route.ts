export async function POST(req: Request) {
  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { name, email, phone, message } = await req.json() as {
      name: string;
      email: string;
      phone?: string;
      message: string;
    };

    if (!name || !email || !message) {
      return Response.json({ error: 'name, email, and message are required' }, { status: 400 });
    }

    await resend.emails.send({
      from: 'My Biz Address <contact@mybizmailbox.biz>',
      to: process.env.CONTACT_EMAIL!,
      reply_to: email,
      subject: `New inquiry from ${name}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        phone ? `Phone: ${phone}` : '',
        '',
        'Message:',
        message,
      ]
        .filter(Boolean)
        .join('\n'),
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error('[contact]', err);
    return Response.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
