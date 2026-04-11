import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getBlogPost, getBlogPosts } from '@/lib/blog'
import { remark } from 'remark'
import remarkHtml from 'remark-html'

export async function generateStaticParams() {
  const posts = await getBlogPosts()
  return posts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPost(slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.keywords,
    openGraph: { title: post.title, description: post.excerpt, type: 'article' },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getBlogPost(slug)
  if (!post) notFound()

  const processed = await remark().use(remarkHtml).process(post.content)
  const html = processed.toString()

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    publisher: { '@type': 'Organization', name: 'CounterUAVHub', url: 'https://counteruavhub.com' },
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <Link href="/blog" className="text-sm text-blue-600 hover:text-blue-700 mb-6 inline-block">
        ← Back to articles
      </Link>

      <article>
        <p className="text-sm text-gray-400 mb-2">{post.date}</p>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">{post.title}</h1>
        <div
          className="prose prose-gray max-w-none prose-headings:font-bold prose-a:text-blue-600 prose-strong:text-gray-900"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>

      <div className="mt-12 p-6 bg-blue-50 rounded-xl border border-blue-100">
        <p className="font-semibold text-blue-900 mb-2">Looking for specific drone frequencies?</p>
        <p className="text-blue-700 text-sm mb-4">Use our Signal Database to look up RF parameters for 25+ drone models.</p>
        <Link href="/tools/drone-frequency-database" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors">
          Open Signal Database →
        </Link>
      </div>
    </main>
  )
}
