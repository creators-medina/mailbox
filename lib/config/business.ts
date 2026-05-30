// Central business configuration — update these values before going live.
// Every address, phone number, and brand name in the app is derived from here.

export const BUSINESS = {
  brandName:      'My Biz Address',
  tagline:        'Professional Business Address in Rockwall, TX',

  // Physical address
  addressStreet:  '802 North Goliad Street',
  addressCity:    'Rockwall',
  addressState:   'TX',
  addressZip:     '75087',
  addressLine1:   '802 North Goliad Street',
  addressLine2:   'Rockwall, TX 75087',
  /** Full single-line address for display and structured data */
  addressFull:    '802 North Goliad Street, Rockwall, TX 75087',

  // Contact
  phone:          '(469) 893-4120',
  phoneE164:      '+14698934120',
  email:          'info@mybizaddress.co',

  // Hours
  hoursShort:     'Mon–Sat, 9 am – 6 pm',
  hoursLong:      'Monday – Saturday, 9 am – 6 pm',
  hoursOpen:      '09:00',
  hoursClose:     '18:00',

  // Web
  websiteUrl:     'https://www.mybizaddress.co',

  // Suite assignment prefix
  suitePrefix:    'MB',
  suiteStartNum:  1001,
} as const;

/** Short address used in signup page plan card and similar compact contexts */
export const SHORT_ADDRESS = `${BUSINESS.addressStreet} · ${BUSINESS.addressCity}, ${BUSINESS.addressState}`;

/** Full business address line assigned to customers: street + suite + city/state/zip.
 *  If the suite label already starts with "Suite" (e.g. "Suite201") it is used
 *  verbatim; otherwise a "Suite " prefix is added (e.g. legacy "MB1001"). */
export function buildCustomerAddress(suiteNumber: string): string {
  const suite = suiteNumber.trim();
  const label = /^suite/i.test(suite) ? suite : `Suite ${suite}`;
  return `${BUSINESS.addressStreet}, ${label}, ${BUSINESS.addressCity}, ${BUSINESS.addressState} ${BUSINESS.addressZip}`;
}
