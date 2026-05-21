import type { Metadata } from 'next';
import { BUSINESS } from '@/lib/config/business';
import { LegalPage, H2, H3, P, UL, LI, MailLink, ReviewNote } from '@/components/LegalPage';

const PRIVACY_EMAIL = 'support@mybizmailbox.biz';

export const metadata: Metadata = {
  title: 'Privacy Policy — My Biz Address',
  description:
    'How My Biz Address collects, uses, and shares personal information across our website and mail-receiving services.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="May 19, 2026">
      <P>
        At My Biz Address (&ldquo;we,&rdquo; or &ldquo;us&rdquo;), we value the privacy of individuals
        who use our websites and related services (collectively, our &ldquo;Services&rdquo;). This
        Privacy Notice explains how we collect, use, and share the personal information of users of
        our Services (&ldquo;users,&rdquo; &ldquo;you,&rdquo; or &ldquo;your&rdquo;). By using our
        Services, you agree to the collection, use, disclosure, and processing of your information as
        described by this Privacy Notice.
      </P>
      <P>
        Personal information is information that identifies or could be used to identify a specific
        person. Personal information does not include deidentified information (anonymized or
        pseudonymized) or aggregated information derived from personal information.
      </P>
      <P>
        We may collect a variety of personal information and other information about you or your
        devices from various sources, as described below.
      </P>

      <H2>Information You Provide to Us</H2>
      <H3>Registration Information</H3>
      <P>
        If you sign up for an account, register to use our Services, or sign up for emails or other
        updates, we may ask you for basic contact information, such as your name, email address,
        phone number, and/or mailing address. We may also collect certain demographic information
        when you register for our Services, including your age, gender, personal interests, income,
        and/or marital status.
      </P>
      <H3>Communications</H3>
      <P>
        If you contact us directly, we may collect additional information from you. For example, when
        you reach out to our customer support team, we may ask for your name, email address, mailing
        address, phone number, or other contact information so that we can verify your identity and
        communicate with you. We may also store the contents of any message or attachments that you
        send to us, as well as any information you submit through any of our forms or questionnaires.
      </P>
      <H3>Events</H3>
      <P>
        If you register for an event that we host, whether in-person or online, we may collect
        relevant information such as your name, address, title, company, phone number, or email
        address, as well as specific information relevant to the event for which you are registering.
      </P>
      <H3>User Content</H3>
      <P>
        We may allow you and other Users of our Services to share their own content with others. This
        may include posts, comments, reviews, or other User-generated content. Unless otherwise noted
        when creating such content, this information may be shared publicly through our Services.
      </P>
      <H3>Payment Information</H3>
      <P>
        If you make a purchase through our Services, we (or a third-party payment processor acting on
        our behalf) may collect your payment-related information, such as credit card or other
        financial information.
      </P>
      <H3>Job Applications</H3>
      <P>
        If you apply for a job with us, we may collect relevant information such as your name, phone
        number, email address, position, job history, education history, references, a cover letter,
        and other similar information.
      </P>

      <H2>Information We Collect Automatically When You Use Our Services</H2>
      <H3>Device Information</H3>
      <P>
        We may collect information about the devices and software you use to access our Services,
        such as your IP address, web browser type, operating system version, device identifiers, and
        other similar information.
      </P>
      <H3>Usage Information</H3>
      <P>
        To help us understand how you use our Services and to help us improve them, we may collect
        data about your interactions with our Services. This includes, but is not limited to,
        information such as crash reports, session lengths and times, the specific pages and other
        content you view, and any searches you conduct on our site.
      </P>
      <H3>Cookies and Similar Technologies</H3>
      <P>
        We and our third-party partners may collect information using cookies, pixel tags, or similar
        technologies. Cookies are small text files containing a string of alphanumeric characters. We
        may use both session cookies and persistent cookies. A session cookie disappears after you
        close your browser. A persistent cookie remains after you close your browser and may be used
        by your browser on subsequent visits to our Services.
      </P>

      <H2>Information We Receive from Other Sources</H2>
      <P>
        We may receive information about you from other sources, including third parties that help us
        update, expand, and analyze our records, identify new customers, or detect or prevent fraud.
        What information we receive from third parties is governed by the privacy settings, policies,
        and/or procedures of the relevant organizations, and we encourage you to review them.
      </P>

      <H2>How We Use the Information We Collect</H2>
      <P>We may use the information we collect:</P>
      <UL>
        <LI>To provide, maintain, improve, and enhance our Services;</LI>
        <LI>To understand and analyze how you use our Services and develop new products, services, features, and functionality;</LI>
        <LI>To facilitate purchases of products or services that you order;</LI>
        <LI>To host events;</LI>
        <LI>To allow you to share content with other Users of our Services;</LI>
        <LI>To evaluate and process applications for jobs with us;</LI>
        <LI>To communicate with you, provide you with updates and other information relating to our Services, provide information that you request, respond to comments and questions, and otherwise provide User support;</LI>
        <LI>For marketing and advertising purposes, including developing and providing promotional and advertising materials that may be relevant, valuable or otherwise of interest to you;</LI>
        <LI>To detect and prevent fraud, and respond to trust and safety issues that may arise;</LI>
        <LI>In connection with generative AI applications;</LI>
        <LI>For compliance purposes, including enforcing our Terms of Service or other legal rights, or as may be required by applicable laws and regulations or requested by any judicial process or governmental agency; and</LI>
        <LI>For other purposes for which we provide specific notice at the time the information is collected.</LI>
      </UL>

      <H2>How We Share the Information We Collect</H2>
      <H3>Service Providers</H3>
      <P>
        We may share any information we collect with service providers retained in connection with
        the provision of our Services. These companies are permitted to use this information to help
        us provide our Services, to improve the services they provide us, and for other purposes
        disclosed in this Privacy Notice.
      </P>
      <H3>Our Affiliates and Representatives</H3>
      <P>
        We may share your information with our affiliates, subsidiaries, and representatives as needed
        to provide our Services.
      </P>
      <H3>Other Users</H3>
      <P>
        Content you post on our websites, including comments, may be displayed to other Users as
        appropriate.
      </P>
      <H3>Our Advertising and Analytics Partners</H3>
      <P>
        We work with our Service Providers and other analytics and/or advertising partners to collect
        and process certain analytics data regarding your use of our Services and to conduct
        advertising via cookies, as detailed below. Our Service Providers and other analytics and/or
        advertising partners may also collect information about your use of other websites, apps, and
        online resources. Parties that may process your information for advertising and analytics
        purposes include our Service Providers and may also include:
      </P>
      <UL>
        <LI><strong>Google</strong> — We may use Google&rsquo;s services to collect and process analytics data about how our Users interact with our Services and to place ads that we think may interest Users and potential users. For more information, see Google&rsquo;s Privacy &amp; Terms page.</LI>
        <LI><strong>Meta</strong> — We may use Meta&rsquo;s services to place ads that we think may interest our users and potential users across Meta&rsquo;s various websites, such as Facebook and Instagram. For more information, see Meta&rsquo;s Data Policy and Privacy Center.</LI>
        <LI><strong>LinkedIn</strong> — We may use LinkedIn&rsquo;s services to place ads that we think may interest our users and potential users, as well as to advertise openings to potential employees. For more information, see LinkedIn&rsquo;s Privacy Policy and Cookie Policy.</LI>
        <LI><strong>Microsoft</strong> — We may use Microsoft&rsquo;s services to place ads that we think may interest our users and potential users. For more information, see Microsoft&rsquo;s Advertising Policies.</LI>
      </UL>
      <P>
        Please note that our Service Providers and advertising and analytics partners may change from
        time to time. If you would like a current list of the specific parties we are working with to
        provide analytics and/or advertising services, contact us at <MailLink email={PRIVACY_EMAIL} />.
        For details about your choices regarding how these partners use your information, see the Your
        Choices section below.
      </P>
      <H3>As Required by Law and Similar Disclosures</H3>
      <P>
        We may access, preserve, and disclose your information if we believe doing so is required or
        appropriate to: (a) comply with law enforcement requests and legal process, such as a court
        order or subpoena; (b) respond to your requests; or (c) protect your, our, or others&rsquo;
        rights, property, or safety. In particular, we may disclose relevant information to the
        appropriate third parties if you post any illegal, threatening, or objectionable content on
        or through the Services.
      </P>
      <H3>Events</H3>
      <P>We may share your information with event partners or co-sponsors to facilitate the events for which you register.</P>
      <H3>Merger, Sale, or Other Asset Transfers</H3>
      <P>
        We may transfer your information to service providers, advisors, potential transactional
        partners, or other third parties in connection with the consideration, negotiation, or
        completion of a corporate transaction in which we are acquired by or merged with another
        company or in which we sell, liquidate, or transfer all or a portion of our assets. The use
        of your information following any of these events will be governed by the same general
        provisions of this Privacy Notice.
      </P>
      <H3>Consent</H3>
      <P>We may also disclose your information with your permission.</P>

      <H2>Your Choices</H2>
      <H3>Our Communications</H3>
      <P>
        From time to time, you may receive marketing or other informational email messages from us.
        You can unsubscribe from our promotional and informational emails via the link provided in
        the emails. After opting out of receiving such messages from us, users may continue to
        receive administrative messages from us that are necessary to service User accounts.
      </P>
      <H3>Cookies</H3>
      <P>
        Most web browsers allow you to manage cookies through the browser settings. To find out more
        about cookies, you can visit{' '}
        <a href="https://www.aboutcookies.org" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--c-gold-2,#C99A5A)' }}>www.aboutcookies.org</a>{' '}
        or{' '}
        <a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--c-gold-2,#C99A5A)' }}>www.allaboutcookies.org</a>.
      </P>
      <H3>Our Partners</H3>
      <P>
        You can learn more about Google&rsquo;s privacy practices and your options for how they use
        your information on Google&rsquo;s website. You can also install the Google Analytics Opt-out
        Browser Add-on. Meta, the parent company of Facebook, provides information about how it uses
        the information it collects through our Services in its Data Policy. You can also learn
        specifically about Facebook&rsquo;s advertising practices on its website.
      </P>
      <P>
        Some of our advertising partners may be members of the Network Advertising Initiative or the
        Digital Advertising Alliance. You can visit those organizations&rsquo; websites to learn about
        how you may opt out of receiving web-based personalized ads from their member companies. You
        can also access any settings offered by your mobile operating system to limit ad tracking. To
        inquire about your choices regarding our business partners generally, contact us at{' '}
        <MailLink email={PRIVACY_EMAIL} />.
      </P>

      <H2>Third-Party Content</H2>
      <P>
        Our Services may contain links to other websites, products, or services that we do not own or
        operate. We are not responsible for the content provided by, or the privacy practices of,
        these third parties. Please be aware that this Privacy Notice does not apply to your
        activities on these third-party services or any information you disclose to these third
        parties. We encourage you to read their privacy policies before providing any information to
        them.
      </P>

      <H2>Security</H2>
      <P>
        We make reasonable efforts to protect your information by using administrative, technological,
        and physical safeguards designed to improve the security of the information we maintain and
        protect it from accidental loss, unauthorized access or use, or any other inappropriate or
        unlawful processing. Because no information system can be 100% secure, we cannot guarantee the
        absolute security of your information.
      </P>

      <H2>Children&rsquo;s Privacy</H2>
      <P>
        We do not knowingly collect, maintain, or use information from children under 13 years of age,
        and no part of our Services are directed toward children. If you learn that a child has
        provided us with information in violation of this Privacy Notice, then you may alert us at{' '}
        <MailLink email={PRIVACY_EMAIL} />.
      </P>

      <H2>International Visitors</H2>
      <P>
        Our Services are hosted in the United States and intended for use by individuals located
        within the United States. If you choose to use the Services from the European Union or other
        regions of the world with laws governing data collection and use that may differ from U.S.
        law, please note that you are transferring your information outside of those regions to the
        United States for storage and processing. Also, we may transfer your data from the U.S. to
        other countries or regions in connection with operating the Services and storing or processing
        data. By using our Services, you consent to the transfer, storage, and processing of your
        information as described in this Privacy Notice.
      </P>

      <H2>Changes to this Privacy Notice</H2>
      <P>
        We will post any adjustments to the Privacy Notice on this page, and the revised version will
        be effective when it is posted. If we make material changes, we may notify you via a notice
        posted on our website or another method. We encourage you to read this Privacy Notice
        periodically to stay up to date about our privacy practices.
      </P>

      <H2>Contact Us</H2>
      <P>
        All feedback, comments, requests for technical support, and other communications relating to
        the Sites and our data collection and processing activities should be directed to{' '}
        <MailLink email={PRIVACY_EMAIL} />.
      </P>
      <P>
        My Biz Address<br />
        {BUSINESS.addressLine1}<br />
        {BUSINESS.addressLine2}<br />
        Phone:{' '}
        <a href={`tel:${BUSINESS.phoneE164}`} style={{ color: 'var(--c-gold-2,#C99A5A)', textDecoration: 'none' }}>{BUSINESS.phone}</a>
      </P>

      <P style={{ color: 'var(--c-text-3)', fontSize: 13 }}>
        Copyright © 2026 My Biz Address — All Rights Reserved.
      </P>

      <ReviewNote>
        Note for the business owner: this policy was carried over from the prior
        &ldquo;My Biz Mailbox&rdquo; site and updated to the &ldquo;My Biz Address&rdquo; brand. Confirm
        the correct <strong>legal entity name</strong> (My Biz Mailbox vs. My Biz Address), confirm the{' '}
        <strong>{PRIVACY_EMAIL}</strong> inbox is monitored, and have counsel confirm whether
        state-specific privacy disclosures (e.g. a California &ldquo;Your Privacy Rights&rdquo; section)
        are required for your customer base. This page is not legal advice.
      </ReviewNote>
    </LegalPage>
  );
}
