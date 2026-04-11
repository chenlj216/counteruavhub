import Link from 'next/link'
import { drones } from '@/data/drones'
import { getBlogPosts } from '@/lib/blog'

export default async function HomePage() {
  const recentDrones = drones.slice(0, 6)
  const posts = await getBlogPosts()
  const recentPosts = posts.slice(0, 3)

  return (
    <main>
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
            Counter-Drone Technical Reference
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Look up RF signal parameters, frequency bands, and counter-drone specifications
            for 25+ drone models. Built for engineers, security professionals, and researchers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/tools/drone-frequency-database"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              Open Signal Database →
            </Link>
            <Link
              href="/blog"
              className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              Read Technical Articles
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-blue-600 text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-8 text-center text-sm font-medium">
            <div><span className="text-2xl font-bold block">{drones.length}+</span> Drone Models</div>
            <div><span className="text-2xl font-bold block">6</span> Frequency Bands</div>
            <div><span className="text-2xl font-bold block">4</span> Categories</div>
            <div><span className="text-2xl font-bold block">Free</span> No Sign-up</div>
          </div>
        </div>
      </section>

      {/* Tool feature */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Dual-Direction Signal Lookup
            </h2>
            <p className="text-gray-600 mb-6 text-lg">
              Query by drone model to get its full signal profile, or query by frequency band
              to find all drones operating in that range.
            </p>
            <ul className="space-y-3 text-gray-700 mb-8">
              {[
                'Control frequencies, video protocols, GPS bands',
                'Maximum TX power and modulation type',
                'Recommended jamming frequency ranges',
                'RF detection configuration guidance',
                'Data linked to official specs and FCC filings',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5 shrink-0">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/tools/drone-frequency-database"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Open Signal Database →
            </Link>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-3 font-medium">Recently Added Models</p>
            <div className="space-y-2">
              {recentDrones.map((drone) => (
                <div key={drone.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{drone.name}</p>
                    <p className="text-xs text-gray-500">{drone.controlFreq}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 capitalize">
                    {drone.category}
                  </span>
                </div>
              ))}
            </div>
            <Link href="/tools/drone-frequency-database" className="block text-center text-sm text-blue-600 hover:text-blue-700 mt-4 font-medium">
              View all {drones.length} models →
            </Link>
          </div>
        </div>
      </section>

      {/* Blog section */}
      {recentPosts.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Technical Articles</h2>
              <Link href="/blog" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentPosts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all">
                  <p className="text-xs text-gray-400 mb-2">{post.date}</p>
                  <h3 className="font-semibold text-gray-900 mb-2 leading-snug">{post.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{post.excerpt}</p>
                  <p className="text-sm text-blue-600 mt-3 font-medium">Read more →</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Need frequency data for a specific drone?
        </h2>
        <p className="text-gray-600 mb-6">
          Search our database of 25+ models including DJI, Autel, Parrot, Skydio, and FPV protocols.
        </p>
        <Link
          href="/tools/drone-frequency-database"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
        >
          Search the Database
        </Link>
      </section>
    </main>
  )
}
