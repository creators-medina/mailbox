import type { MetadataRoute } from 'next';
import { BUSINESS } from '@/lib/config/business';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/'] },
    sitemap: `${BUSINESS.websiteUrl}/sitemap.xml`,
  };
}
