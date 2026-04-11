import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About — CounterUAVHub',
  description: 'CounterUAVHub is a technical reference platform for counter-drone professionals, engineers, and security researchers.',
}

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">About CounterUAVHub</h1>

      <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
        <p>
          CounterUAVHub is a technical reference platform built for engineers, security professionals,
          and researchers working in the counter-drone space.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8">What we provide</h2>
        <ul className="space-y-2">
          <li><strong>Drone Signal Database</strong> — RF signal parameters for 25+ drone models, including control frequencies, video protocols, GPS bands, and recommended counter-drone frequencies.</li>
          <li><strong>Technical Articles</strong> — In-depth guides on drone frequencies, jamming technology, and RF detection systems.</li>
          <li><strong>Industry News</strong> — Aggregated news from FlightGlobal, The War Zone, Drone DJ, and other industry sources.</li>
        </ul>

        <h2 className="text-xl font-bold text-gray-900 mt-8">Data accuracy</h2>
        <p>
          All frequency data is sourced from official manufacturer specifications, FCC filings, and
          verified third-party technical reports. Each record includes a source tier (Official / FCC / Third-party)
          so you can assess the confidence level of the data.
        </p>
        <p className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          <strong>Important:</strong> Data is provided for informational and research purposes only.
          Always verify technical parameters against current official sources before operational deployment.
          Counter-drone equipment use may be subject to local laws and regulations.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8">Contact</h2>
        <p>
          For corrections, data contributions, or general inquiries, reach us at{' '}
          <a href="mailto:hello@counteruavhub.com" className="text-blue-600 hover:underline">
            hello@counteruavhub.com
          </a>
        </p>
      </div>

      <div className="mt-10">
        <Link href="/tools/drone-frequency-database" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
          Open Signal Database →
        </Link>
      </div>
    </main>
  )
}
