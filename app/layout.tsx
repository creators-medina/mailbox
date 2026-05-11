import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import { BUSINESS } from '@/lib/config/business';
import '../colors_and_type.css';
import '../website.css';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });

const TITLE = `${BUSINESS.brandName} — ${BUSINESS.tagline}`;
const DESCRIPTION =
  'Get a real Rockwall, TX business address for your LLC, receive mail and packages, and manage everything online. Starting at $29.99/mo.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  metadataBase: new URL(BUSINESS.websiteUrl),
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: BUSINESS.websiteUrl,
    siteName: BUSINESS.brandName,
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
  alternates: { canonical: BUSINESS.websiteUrl },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  return (
    <html lang="en" className={inter.variable}>
      <body>
        {children}
        {gaId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script id="ga-init" strategy="afterInteractive">{`
              window.dataLayer=window.dataLayer||[];
              function gtag(){dataLayer.push(arguments);}
              gtag('js',new Date());
              gtag('config','${gaId}');
            `}</Script>
          </>
        )}
      </body>
    </html>
  );
}
