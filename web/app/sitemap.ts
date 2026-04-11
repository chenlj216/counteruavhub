import { MetadataRoute } from 'next'

export const dynamic = 'force-static'
import { drones } from '@/data/drones'
import { getBlogPosts } from '@/lib/blog'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://counteruavhub.com'
  const posts = await getBlogPosts()

  const static_pages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/tools/drone-frequency-database`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/news`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  ]

  const blog_pages: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  return [...static_pages, ...blog_pages]
}
