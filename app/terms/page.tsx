import type { Metadata } from 'next';
import { BUSINESS } from '@/lib/config/business';
import { LegalPage, H2, P, UL, LI, MailLink, ReviewNote } from '@/components/LegalPage';

const SUPPORT_EMAIL = BUSINESS.email; // info@mybizmailbox.biz
const PRIVACY_EMAIL = 'support@mybizmailbox.biz';

export const metadata: Metadata = {
  title: 'Terms of Service — My Biz Address',
  description:
    'The terms governing use of My Biz Address business address and mail-receiving services in Rockwall, TX.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="May 21, 2026">
      <ReviewNote>
        Note for the business owner: a Terms of Service was not present in the
        prior site content provided, so the terms below were drafted to match
        how the service and app actually work (CMRA mail receiving, USPS Form
        1583, $29.99/mo plus optional add-ons, no long-term contract, Stripe
        billing). <strong>Have a licensed attorney review and finalize this
        document before launch</strong> — particularly the liability,
        indemnification, dispute-resolution, and governing-law sections. This
        page is not legal advice.
      </ReviewNote>

      <P>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the websites,
        applications, and services (collectively, the &ldquo;Services&rdquo;) provided by My Biz
        Address (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), a commercial mail
        receiving agency (&ldquo;CMRA&rdquo;) located at {BUSINESS.addressFull}. By creating an
        account, purchasing a plan, or otherwise using the Services, you agree to these Terms. If you
        do not agree, do not use the Services.
      </P>

      <H2>1. The Service</H2>
      <P>
        We provide a real street business address with an assigned suite number, plus mail
        receiving and handling at our Rockwall, Texas location. Depending on the plan and add-ons you
        select, the Services may include envelope notifications, mail scanning, local pickup, mail
        forwarding, shredding, a business phone number, and Google Business Profile setup assistance.
        We are not the United States Postal Service (&ldquo;USPS&rdquo;), a bank, a law firm, or a
        registered-agent service, and we do not provide legal, tax, or financial advice.
      </P>

      <H2>2. Eligibility and USPS Form 1583</H2>
      <P>
        To receive mail at our address, federal regulations require every customer to complete and
        sign <strong>USPS Form 1583</strong> (Application for Delivery of Mail Through a Commercial
        Mail Receiving Agency) and to provide two valid forms of identification, at least one of
        which must be a government-issued photo ID. Form 1583 must be properly verified
        (notarized or verified in person) as required by USPS rules.
      </P>
      <UL>
        <LI>We cannot legally accept or release mail on your behalf until your Form 1583 and required identification are on file and verified.</LI>
        <LI>You must be at least 18 years old and provide accurate, current, and complete information.</LI>
        <LI>You authorize us to act as your agent solely for the purpose of receiving your mail and parcels.</LI>
      </UL>

      <H2>3. Acceptable Use of the Address</H2>
      <P>You agree that you will not use the address or the Services to:</P>
      <UL>
        <LI>conduct or facilitate any illegal, fraudulent, or deceptive activity;</LI>
        <LI>receive hazardous, perishable, illegal, or prohibited materials;</LI>
        <LI>impersonate another person or business, or misrepresent your identity; or</LI>
        <LI>violate any applicable federal, state, or local law, or USPS regulation.</LI>
      </UL>
      <P>
        You may use the assigned address as your business mailing address (for example, on business
        filings, banking, licensing, your website, and business cards) to the extent permitted by
        applicable law. You are solely responsible for confirming that the address satisfies the
        requirements of any third party (such as a state filing office, bank, or licensing authority)
        for your particular use.
      </P>

      <H2>4. Plans, Fees, and Billing</H2>
      <UL>
        <LI>The Business Address plan is billed at $29.99 per month. Optional add-ons (such as Mail Scanning and a Business Phone Number at $9.99/month each, and Google Business Profile Setup as a one-time $49.99 fee) are billed as selected at checkout.</LI>
        <LI>Recurring fees are billed in advance on a monthly basis and renew automatically until cancelled. Payment is processed by our third-party payment processor (Stripe); we do not store full payment card numbers.</LI>
        <LI>Prices, plans, and add-ons may change. We will provide notice of material pricing changes, and changes will take effect on your next billing cycle.</LI>
        <LI>You are responsible for any applicable taxes.</LI>
      </UL>

      <H2>5. Cancellation and Refunds</H2>
      <UL>
        <LI>There is no long-term contract. You may cancel at any time through your account&rsquo;s billing portal or by contacting us.</LI>
        <LI>Cancellation stops future renewals. Your address and mail service remain active through the end of the current paid billing period, after which the Services end.</LI>
        <LI>Except where required by law, monthly fees already billed are non-refundable, and one-time setup fees are non-refundable once work has begun.</LI>
        <LI>On cancellation you must update your address with all senders and arrange for any remaining mail. We are not obligated to receive, hold, scan, or forward mail after your Services end.</LI>
      </UL>

      <H2>6. Mail Handling, Storage, and Forwarding</H2>
      <UL>
        <LI>We will receive mail and parcels addressed to your assigned suite and notify you according to your plan.</LI>
        <LI>You are responsible for requesting scanning, forwarding, pickup, or shredding in a timely manner. Forwarding postage and handling may incur additional charges.</LI>
        <LI>We may set reasonable limits on storage volume and duration. Unclaimed, abandoned, or excess mail may be returned to sender, disposed of, or shredded after a reasonable period and after any notice required by law.</LI>
        <LI>We handle mail with reasonable care but are not liable for items lost, delayed, damaged, or mishandled by USPS or other carriers before delivery to us, or for the contents of mail.</LI>
        <LI>We do not open mail except when you request content scanning or as permitted or required by law.</LI>
      </UL>

      <H2>7. Accounts and Security</H2>
      <P>
        You are responsible for maintaining the confidentiality of your account credentials and for
        all activity under your account. Notify us promptly of any unauthorized use. We may suspend
        or terminate accounts that violate these Terms or that we reasonably believe present a legal
        or security risk.
      </P>

      <H2>8. Service Limitations and Disclaimers</H2>
      <P>
        The Services are provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without
        warranties of any kind, whether express or implied, including implied warranties of
        merchantability, fitness for a particular purpose, and non-infringement. We do not warrant
        that the Services will be uninterrupted, error-free, or secure, or that mail will always be
        received, scanned, forwarded, or held without delay. We are a local business and our
        location operates {BUSINESS.hoursLong}.
      </P>

      <H2>9. Limitation of Liability</H2>
      <P>
        To the maximum extent permitted by law, we will not be liable for any indirect, incidental,
        special, consequential, or punitive damages, or for lost profits, lost data, or the value or
        contents of any mail or parcel. Our total liability arising out of or relating to the Services
        will not exceed the amount you paid us for the Services in the three (3) months preceding the
        event giving rise to the claim.
      </P>

      <H2>10. Indemnification</H2>
      <P>
        You agree to indemnify and hold us harmless from any claims, losses, liabilities, and expenses
        (including reasonable attorneys&rsquo; fees) arising out of your use of the Services, your
        violation of these Terms, or your violation of any law or the rights of any third party.
      </P>

      <H2>11. Termination</H2>
      <P>
        We may suspend or terminate your access to the Services at any time if you violate these
        Terms, fail to pay fees when due, fail to maintain a valid Form 1583, or use the Services
        unlawfully. Upon termination, your right to use the Services and the assigned address ends.
      </P>

      <H2>12. Privacy</H2>
      <P>
        Your use of the Services is also governed by our{' '}
        <a href="/privacy" style={{ color: 'var(--c-gold-2,#C99A5A)', textDecoration: 'none' }}>Privacy Policy</a>,
        which is incorporated into these Terms by reference.
      </P>

      <H2>13. Changes to these Terms</H2>
      <P>
        We may update these Terms from time to time. The revised version will be effective when posted
        on this page. If we make material changes, we may provide additional notice. Your continued
        use of the Services after changes take effect constitutes acceptance of the updated Terms.
      </P>

      <H2>14. Governing Law</H2>
      <P>
        These Terms are governed by the laws of the State of Texas, without regard to its conflict-of-laws
        rules. You agree that the state and federal courts located in Rockwall County, Texas have
        jurisdiction over any dispute arising out of or relating to these Terms or the Services, except
        where prohibited by applicable law.
      </P>

      <H2>15. Contact Us</H2>
      <P>
        Questions about these Terms can be sent to <MailLink email={SUPPORT_EMAIL} /> (general support)
        or <MailLink email={PRIVACY_EMAIL} /> (privacy and data requests).
      </P>
      <P>
        My Biz Address<br />
        {BUSINESS.addressLine1}<br />
        {BUSINESS.addressLine2}<br />
        Phone:{' '}
        <a href={`tel:${BUSINESS.phoneE164}`} style={{ color: 'var(--c-gold-2,#C99A5A)', textDecoration: 'none' }}>{BUSINESS.phone}</a><br />
        Hours: {BUSINESS.hoursLong}
      </P>

      <P style={{ color: 'var(--c-text-3)', fontSize: 13 }}>
        Copyright © 2026 My Biz Address — All Rights Reserved.
      </P>
    </LegalPage>
  );
}
