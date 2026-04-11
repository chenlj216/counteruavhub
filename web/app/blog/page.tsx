import { Metadata } from 'next'
import Link from 'next/link'
import { getBlogPosts } from '@/lib/blog'

export const metadata: Metadata = {
  title: 'Blog — Counter-Drone Technical Articles',
  description: 'Technical articles on drone RF frequencies, counter-drone systems, jamming technology, and UAV detection for security professionals.',
}

export default async function BlogPage() {
  const posts = await getBlogPosts()

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Technical Articles</h1>
      <p className="text-gray-500 mb-10">In-depth guides on drone frequencies, counter-UAV systems, and RF detection.</p>

      {posts.length === 0 ? (
        <p className="text-gray-400">Articles coming soon.</p>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="block bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-sm transition-all">
              <p className="text-xs text-gray-400 mb-1">{post.date}</p>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{post.title}</h2>
              <p className="text-gray-500">{post.excerpt}</p>
              <p className="text-blue-600 text-sm font-medium mt-3">Read more →</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
