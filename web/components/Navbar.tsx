import Link from 'next/link'

export default function Navbar() {
  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
          CounterUAV<span className="text-blue-600">Hub</span>
        </Link>
        <div className="flex items-center gap-6 text-sm font-medium">
          <Link href="/tools/drone-frequency-database" className="text-gray-600 hover:text-blue-600 transition-colors">
            Signal Database
          </Link>
          <Link href="/blog" className="text-gray-600 hover:text-blue-600 transition-colors">
            Blog
          </Link>
          <Link href="/news" className="text-gray-600 hover:text-blue-600 transition-colors">
            News
          </Link>
          <Link href="/about" className="text-gray-600 hover:text-gray-900 transition-colors">
            About
          </Link>
        </div>
      </nav>
    </header>
  )
}
