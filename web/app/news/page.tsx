import { Metadata } from 'next'
import { newsItems, categoryLabels, categoryColors } from '@/data/news'

export const metadata: Metadata = {
  title: 'Counter-Drone Industry News',
  description: 'Latest news on counter-drone technology, UAV incidents, anti-drone regulation, and defense market developments.',
}

export default function NewsPage() {
  const sorted = [...newsItems].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Industry News</h1>
      <p className="text-gray-500 mb-10">
        Curated developments in counter-drone technology, UAV incidents, and regulations.
        <span className="block text-xs mt-1 text-gray-400">Manually curated · Last updated April 2026</span>
      </p>

      <div className="space-y-5">
        {sorted.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColors[item.category]}`}>
                {categoryLabels[item.category]}
              </span>
              <span className="text-xs text-gray-400">{item.source}</span>
              <span className="text-xs text-gray-300">·</span>
              <span className="text-xs text-gray-400">{item.date}</span>
            </div>
            <h2 className="text-base font-semibold text-gray-900 mb-1 leading-snug">{item.title}</h2>
            <p className="text-sm text-gray-500 leading-relaxed">{item.excerpt}</p>
            <p className="text-blue-600 text-xs font-medium mt-2">Read at {item.source} →</p>
          </a>
        ))}
      </div>
    </main>
  )
}
