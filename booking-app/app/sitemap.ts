import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://bookings.buildark.dev',
      lastModified: new Date('2026-04-08'),
      changeFrequency: 'monthly',
      priority: 1.0,
    },
  ]
}
