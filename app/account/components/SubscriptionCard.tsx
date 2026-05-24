import BillingButton from '../BillingButton';
import AddonPurchaseButton from './AddonPurchaseButton';

export type SubscriptionSummary = {
  status: string;
  mail_scanning_enabled: boolean;
  business_phone_enabled: boolean;
  google_business_setup_purchased: boolean;
  current_period_end: string | null;
} | null;

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function SubscriptionCard({
  subscription,
  hasStripeCustomer,
}: {
  subscription: SubscriptionSummary;
  hasStripeCustomer: boolean;
}) {
  return (
    <div className="dash-card">
      <span className="dash-card-title">Subscription</span>

      <div className="addon-row" style={{ paddingTop: 0 }}>
        <span className="addon-row-label">Business Address</span>
        <span style={{ font: '700 14px/1 var(--font-display,sans-serif)', color: '#fff' }}>
          $29.99<span style={{ font: '400 11px/1 var(--font-text,sans-serif)', color: 'var(--c-text-3)' }}>/mo</span>
        </span>
      </div>

      {subscription ? (
        <>
          <div className="addon-row">
            <span className="addon-row-label">Mail Scanning</span>
            {subscription.mail_scanning_enabled
              ? <span className="addon-active">Active</span>
              : <AddonPurchaseButton endpoint="/api/billing/addons/mail-scanning" label="Add Mail Scanning" />}
          </div>
          <div className="addon-row">
            <span className="addon-row-label">Business Phone</span>
            {subscription.business_phone_enabled
              ? <span className="addon-active">Active</span>
              : <AddonPurchaseButton endpoint="/api/billing/addons/business-phone" label="Add Business Phone" />}
          </div>
          <div className="addon-row">
            <span className="addon-row-label">Google Business Setup</span>
            {subscription.google_business_setup_purchased
              ? <span className="addon-active">Purchased</span>
              : <AddonPurchaseButton endpoint="/api/billing/addons/google-business" label="Purchase Google Business Setup" />}
          </div>
          {subscription.current_period_end && (
            <p style={{ font: '400 12px/1.4 var(--font-text,sans-serif)', color: 'var(--c-text-3)', margin: '14px 0 0' }}>
              Renews {fmt(subscription.current_period_end)}
            </p>
          )}
        </>
      ) : (
        <p style={{ font: '400 13px/1.5 var(--font-text,sans-serif)', color: 'var(--c-text-3)', margin: '8px 0 0' }}>
          Your add-ons and renewal date will appear here once setup completes.
        </p>
      )}

      {hasStripeCustomer && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--c-border,rgba(255,255,255,0.07))' }}>
          <BillingButton />
        </div>
      )}
    </div>
  );
}
