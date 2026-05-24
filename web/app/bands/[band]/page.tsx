import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { drones, type DroneRecord } from '@/data/drones'
import {
  FREQUENCY_BANDS,
  filterDronesForBand,
  getFrequencyBand,
  summarizeBandDrones,
} from '@/lib/frequency-bands.mjs'

export async function generateStaticParams() {
  return FREQUENCY_BANDS.map((band) => ({ band: band.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ band: string }> }): Promise<Metadata> {
  const { band: slug } = await params
  const band = getFrequencyBand(slug)
  if (!band) return {}

  return {
    title: band.title,
    description: `${band.description} Explore matching drone models, RF detection notes, and counter-UAS planning context.`,
    keywords: `${band.shortLabel} drone frequency, ${band.shortLabel} UAV signal, drone RF band, counter drone detection`,
    openGraph: {
      title: band.title,
      description: band.description,
      type: 'article',
      url: `https://counteruavhub.com/bands/${band.slug}`,
    },
  }
}

export default async function FrequencyBandPage({ params }: { params: Promise<{ band: string }> }) {
  const { band: slug } = await params
  const band = getFrequencyBand(slug)
  if (!band) notFound()

  const matchingDrones = filterDronesForBand(drones, slug) as DroneRecord[]
  const summary = summarizeBandDrones(matchingDrones)
  const featuredDrones = matchingDrones.slice(0, 12)

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: band.title,
    description: band.description,
    url: `https://counteruavhub.com/bands/${band.slug}`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'CounterUAVHub',
      url: 'https://counteruavhub.com',
    },
  }

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <span>/</span>
        <Link href="/tools/drone-frequency-database" className="hover:text-blue-600">Signal Database</Link>
        <span>/</span>
        <span className="text-gray-900">{band.shortLabel}</span>
      </nav>

      <header className="mb-10">
        <p className="text-sm font-semibold text-blue-600 mb-2">Frequency Band Guide</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{band.title}</h1>
        <p className="text-lg text-gray-600 max-w-3xl">{band.description}</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="border border-gray-200 rounded-lg p-5 bg-white">
          <p className="text-sm text-gray-500 mb-1">Matching Models</p>
          <p className="text-3xl font-bold text-gray-900">{summary.total}</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-5 bg-white">
          <p className="text-sm text-gray-500 mb-1">Primary Use</p>
          <p className="text-sm text-gray-800">{band.primaryUse}</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-5 bg-white">
          <p className="text-sm text-gray-500 mb-1">Planning Note</p>
          <p className="text-sm text-gray-800">{band.counterUasNote}</p>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Detection Context</h2>
          <p className="text-gray-600 text-sm leading-6">{band.detectionNote}</p>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Database Breakdown</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Categories</p>
              <ul className="space-y-1 text-sm text-gray-700">
                {summary.categories.map((item) => (
                  <li key={item.label} className="flex justify-between gap-4">
                    <span>{item.label}</span>
                    <span className="font-mono text-gray-900">{item.count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Top Brands</p>
              <ul className="space-y-1 text-sm text-gray-700">
                {summary.topBrands.map((item) => (
                  <li key={item.label} className="flex justify-between gap-4">
                    <span>{item.label}</span>
                    <span className="font-mono text-gray-900">{item.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-bold text-gray-900">Models Using {band.shortLabel}</h2>
          <Link href="/tools/drone-frequency-database" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            Open full database →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredDrones.map((drone) => (
            <Link
              key={drone.id}
              href={`/drones/${drone.id}`}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <p className="font-semibold text-gray-900 text-sm">{drone.name}</p>
              <p className="text-xs text-gray-500 mt-1">{drone.brand} · {drone.category}</p>
              <p className="text-xs text-gray-600 mt-3">Control: <span className="font-mono">{drone.controlFreq}</span></p>
              <p className="text-xs text-gray-600 mt-1">Video: <span className="font-mono">{drone.videoFreq}</span></p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-gray-200 pt-8 text-sm text-gray-500 leading-6">
        <p>
          This guide summarizes public RF reference data for engineering planning and research.
          Frequency presence alone does not identify a drone or authorize countermeasure use.
          Always verify against official documentation, local regulations, and controlled test data before deployment.
        </p>
      </section>
    </main>
  )
}
