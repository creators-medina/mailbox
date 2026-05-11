import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';

type Addons = {
  mailScanning?: boolean;
  businessPhone?: boolean;
  googleBusinessSetup?: boolean;
};

type CheckoutBody = {
  email: string;
  name: string;
  businessName: string;
  phone?: string;
  addons: Addons;
};

const REQUIRED_PRICES = [
  'STRIPE_PRICE_BUSINESS_ADDRESS_MONTHLY',
  'STRIPE_PRICE_MAIL_SCANNING_MONTHLY',
  'STRIPE_PRICE_BUSINESS_PHONE_MONTHLY',
  'STRIPE_PRICE_GOOGLE_BUSINESS_SETUP_ONE_TIME',
] as const;

export async function POST(req: Request) {
  try {
    // Validate required env vars before touching Stripe
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Checkout is not configured yet. Please contact us.' },
        { status: 503 },
      );
    }

    const missingPrices = REQUIRED_PRICES.filter(k => !process.env[k]);
    if (missingPrices.length > 0) {
      console.error('[checkout] Missing price env vars:', missingPrices);
      return NextResponse.json(
        { error: 'Missing Stripe price configuration. Please contact us.' },
        { status: 503 },
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      console.error('[checkout] NEXT_PUBLIC_BASE_URL is not set');
      return NextResponse.json(
        { error: 'Unable to start checkout. Please try again.' },
        { status: 503 },
      );
    }

    let body: CheckoutBody;
    try {
      body = await req.json() as CheckoutBody;
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const { email, name, businessName, phone, addons } = body;

    if (!email || !name || !businessName) {
      return NextResponse.json(
        { error: 'email, name, and businessName are required' },
        { status: 400 },
      );
    }

    const stripe = getStripe();

    const lineItems = [
      { price: process.env.STRIPE_PRICE_BUSINESS_ADDRESS_MONTHLY!, quantity: 1 },
      ...(addons.mailScanning
        ? [{ price: process.env.STRIPE_PRICE_MAIL_SCANNING_MONTHLY!, quantity: 1 }]
        : []),
      ...(addons.businessPhone
        ? [{ price: process.env.STRIPE_PRICE_BUSINESS_PHONE_MONTHLY!, quantity: 1 }]
        : []),
    ];

    // Google Business Setup is a one-time fee billed on the first invoice only.
    const addInvoiceItems = addons.googleBusinessSetup
      ? [{ price: process.env.STRIPE_PRICE_GOOGLE_BUSINESS_SETUP_ONE_TIME! }]
      : undefined;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      line_items: lineItems,
      ...(addInvoiceItems ? { add_invoice_items: addInvoiceItems } : {}),
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cancel`,
      metadata: {
        customer_name: name,
        business_name: businessName,
        email,
        phone: phone ?? '',
        addon_mail_scanning: String(!!addons.mailScanning),
        addon_business_phone: String(!!addons.businessPhone),
        addon_google_business: String(!!addons.googleBusinessSetup),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[checkout]', err);
    return NextResponse.json(
      { error: 'Unable to start checkout. Please try again.' },
      { status: 500 },
    );
  }
}
