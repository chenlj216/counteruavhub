import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-gray-900 mb-3">
              CounterUAV<span className="text-blue-600">Hub</span>
            </h3>
            <p className="text-sm text-gray-500">
              Technical reference platform for counter-drone professionals, engineers, and researchers.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Tools</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/tools/drone-frequency-database" className="hover:text-blue-600">Drone Signal Database</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Content</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/blog" className="hover:text-blue-600">Blog</Link></li>
              <li><Link href="/news" className="hover:text-blue-600">Industry News</Link></li>
              <li><Link href="/about" className="hover:text-blue-600">About</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-200 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} CounterUAVHub. Data sourced from official specifications and public records. Always verify before operational deployment.</p>
        </div>
      </div>
    </footer>
  )
}
