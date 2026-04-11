import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Counter-Drone Industry News',
  description: 'Latest news on counter-drone technology, UAV incidents, and anti-drone regulation from industry sources.',
}

export default function NewsPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Industry News</h1>
      <p className="text-gray-500 mb-10">
        Latest developments in counter-drone technology, UAV incidents, and regulations.
      </p>
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg mb-2">News aggregation coming soon.</p>
        <p className="text-sm">We are integrating RSS feeds from FlightGlobal, The War Zone, and Drone DJ.</p>
      </div>
    </main>
  )
}
