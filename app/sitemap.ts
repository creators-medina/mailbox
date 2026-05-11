import type { MetadataRoute } from 'next';
import { BUSINESS } from '@/lib/config/business';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = BUSINESS.websiteUrl;
  return [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/success`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.1 },
    { url: `${base}/cancel`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.1 },
  ];
}
