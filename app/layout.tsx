import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import '../colors_and_type.css';
import '../website.css';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'My Biz Address — Professional Business Address in Rockwall, TX',
  description:
    'Get a real Rockwall, TX business address for your LLC, receive mail and packages, and manage everything online. Starting at $29.99/mo.',
  metadataBase: new URL('https://mybizmailbox.biz'),
  openGraph: {
    title: 'My Biz Address — Professional Business Address in Rockwall, TX',
    description:
      'Get a real Rockwall, TX business address, receive mail and packages, and manage everything online. Starting at $29.99/mo.',
    url: 'https://mybizmailbox.biz',
    siteName: 'My Biz Address',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My Biz Address — Professional Business Address in Rockwall, TX',
    description:
      'Get a real Rockwall, TX business address, receive mail and packages, and manage everything online. Starting at $29.99/mo.',
  },
  alternates: { canonical: 'https://mybizmailbox.biz' },
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
