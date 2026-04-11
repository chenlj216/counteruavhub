import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const BLOG_DIR = path.join(process.cwd(), 'content/blog')

export interface BlogPost {
  slug: string
  title: string
  date: string
  excerpt: string
  content: string
  keywords?: string
}

export async function getBlogPosts(): Promise<Omit<BlogPost, 'content'>[]> {
  if (!fs.existsSync(BLOG_DIR)) return []

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md'))

  return files
    .map((file) => {
      const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8')
      const { data } = matter(raw)
      return {
        slug: file.replace('.md', ''),
        title: data.title ?? '',
        date: data.date ?? '',
        excerpt: data.excerpt ?? '',
        keywords: data.keywords ?? '',
      }
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const file = path.join(BLOG_DIR, `${slug}.md`)
  if (!fs.existsSync(file)) return null

  const raw = fs.readFileSync(file, 'utf-8')
  const { data, content } = matter(raw)

  return {
    slug,
    title: data.title ?? '',
    date: data.date ?? '',
    excerpt: data.excerpt ?? '',
    keywords: data.keywords ?? '',
    content,
  }
}
