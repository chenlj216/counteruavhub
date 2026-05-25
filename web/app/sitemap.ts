import { MetadataRoute } from 'next'

export const dynamic = 'force-static'
import { drones } from '@/data/drones'
import { getBrandSummaries } from '@/lib/brand-pages.mjs'
import { FREQUENCY_BANDS } from '@/lib/frequency-bands.mjs'
import { getBlogPosts } from '@/lib/blog'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://counteruavhub.com'
  const posts = await getBlogPosts()
  const brandSummaries = getBrandSummaries(drones)

  const static_pages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/tools/drone-frequency-database`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/news`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/tools`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/tools/jammer-range-calculator`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/tools/js-ratio-calculator`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/tools/rf-detection-coverage-planner`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/tools/rf-detection-range`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/tools/fspl-calculator`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    ...FREQUENCY_BANDS.map((band) => ({
      url: `${base}/bands/${band.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ]

  const blog_pages: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const drone_pages: MetadataRoute.Sitemap = drones.map((d) => ({
    url: `${base}/drones/${d.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  const brand_pages: MetadataRoute.Sitemap = brandSummaries.map((brand) => ({
    url: `${base}/brands/${brand.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.75,
  }))

  return [...static_pages, ...blog_pages, ...drone_pages, ...brand_pages]
}
