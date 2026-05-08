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

export async function POST(req: Request) {
  const stripe = getStripe();

  try {
    const body = await req.json() as CheckoutBody;
    const { email, name, businessName, phone, addons } = body;

    if (!email || !name || !businessName) {
      return Response.json(
        { error: 'email, name, and businessName are required' },
        { status: 400 },
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://mybizmailbox.biz';

    // Recurring subscription items: base plan + optional recurring add-ons
    const lineItems = [
      { price: process.env.STRIPE_PRICE_BUSINESS_ADDRESS_MONTHLY!, quantity: 1 },
      ...(addons.mailScanning
        ? [{ price: process.env.STRIPE_PRICE_MAIL_SCANNING_MONTHLY!, quantity: 1 }]
        : []),
      ...(addons.businessPhone
        ? [{ price: process.env.STRIPE_PRICE_BUSINESS_PHONE_MONTHLY!, quantity: 1 }]
        : []),
    ];

    // Google Business Setup is a one-time fee. Stripe Checkout (subscription mode)
    // supports add_invoice_items for one-time charges billed on the first invoice only.
    // The price must be configured as type "one_time" (not recurring) in your Stripe dashboard.
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

    return Response.json({ url: session.url });
  } catch (err) {
    console.error('[checkout]', err);
    return Response.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
