import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { drones, type DroneRecord } from '@/data/drones'
import {
  filterDronesForBrand,
  getBrandFromSlug,
  getBrandSummaries,
  summarizeBrandDrones,
} from '@/lib/brand-pages.mjs'
import { DATASET_REVIEWED_LABEL, getSourceConfidence } from '@/lib/source-confidence.mjs'

const CATEGORY_LABEL: Record<string, string> = {
  consumer: 'Consumer',
  industrial: 'Industrial',
  fpv: 'FPV',
  military: 'Military',
}

export async function generateStaticParams() {
  return getBrandSummaries(drones).map((brand) => ({ brand: brand.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ brand: string }> }): Promise<Metadata> {
  const { brand: slug } = await params
  const brand = getBrandFromSlug(drones, slug)
  if (!brand) return {}

  const matchingDrones = filterDronesForBrand(drones, slug)

  return {
    title: `${brand} Drone RF Frequency Guide`,
    description: `Browse public RF signal references for ${matchingDrones.length} ${brand} drone models, including control bands, video links, GNSS notes, and source confidence.`,
    keywords: `${brand} drone frequency, ${brand} UAV RF signal, ${brand} drone control frequency, ${brand} counter-UAS planning`,
    openGraph: {
      title: `${brand} Drone RF Frequency Guide`,
      description: `Public RF reference data and source confidence for ${matchingDrones.length} ${brand} drone models.`,
      type: 'article',
      url: `https://counteruavhub.com/brands/${slug}`,
    },
  }
}

function DroneCard({ drone }: { drone: DroneRecord }) {
  const confidence = getSourceConfidence(drone)

  return (
    <Link
      href={`/drones/${drone.id}`}
      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-semibold text-gray-900 text-sm">{drone.name}</p>
          <p className="text-xs text-gray-500 mt-1">{CATEGORY_LABEL[drone.category]}</p>
        </div>
        <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${confidence.badgeClassName}`}>
          {confidence.level}
        </span>
      </div>
      <p className="text-xs text-gray-600">Control: <span className="font-mono">{drone.controlFreq}</span></p>
      <p className="text-xs text-gray-600 mt-1">Video: <span className="font-mono">{drone.videoFreq}</span></p>
      <p className="text-xs text-gray-500 mt-3">{confidence.label}</p>
    </Link>
  )
}

export default async function BrandPage({ params }: { params: Promise<{ brand: string }> }) {
  const { brand: slug } = await params
  const brand = getBrandFromSlug(drones, slug)
  if (!brand) notFound()

  const matchingDrones = filterDronesForBrand(drones, slug) as DroneRecord[]
  const summary = summarizeBrandDrones(matchingDrones)
  const sortedDrones = [...matchingDrones].sort((a, b) => a.name.localeCompare(b.name))

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${brand} Drone RF Frequency Guide`,
    description: `Public RF reference data for ${matchingDrones.length} ${brand} drone models.`,
    url: `https://counteruavhub.com/brands/${slug}`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'CounterUAVHub',
      url: 'https://counteruavhub.com',
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: matchingDrones.length,
      itemListElement: sortedDrones.slice(0, 20).map((drone, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `https://counteruavhub.com/drones/${drone.id}`,
        name: drone.name,
      })),
    },
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <span>/</span>
        <Link href="/tools/drone-frequency-database" className="hover:text-blue-600">Signal Database</Link>
        <span>/</span>
        <span className="text-gray-900">{brand}</span>
      </nav>

      <header className="mb-10">
        <p className="text-sm font-semibold text-blue-600 mb-2">Brand RF Guide</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{brand} Drone RF Frequency Guide</h1>
        <p className="text-lg text-gray-600 max-w-3xl">
          Public signal reference data for {summary.total} {brand} drone models, including control links,
          video links, GNSS fields, and source confidence labels for engineering research.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="border border-gray-200 rounded-lg p-5 bg-white">
          <p className="text-sm text-gray-500 mb-1">Indexed Models</p>
          <p className="text-3xl font-bold text-gray-900">{summary.total}</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-5 bg-white">
          <p className="text-sm text-gray-500 mb-1">Primary Category</p>
          <p className="text-sm text-gray-800">{summary.categories[0]?.label ?? 'Mixed'} reference records</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-5 bg-white">
          <p className="text-sm text-gray-500 mb-1">Dataset Review</p>
          <p className="text-sm text-gray-800">Reviewed {DATASET_REVIEWED_LABEL}; verify model variants before deployment.</p>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{brand} RF Planning Context</h2>
          <p className="text-gray-600 text-sm leading-6">
            Use this page as a public-source starting point for signal monitoring plans, RF lab checks,
            and authorized counter-UAS assessments. Frequency references alone do not identify a drone,
            prove active emissions, or grant authority to deploy countermeasures.
          </p>
        </div>
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
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Source Confidence</p>
            <ul className="space-y-1 text-sm text-gray-700">
              {summary.sourceConfidence.map((item) => (
                <li key={item.label} className="flex justify-between gap-4">
                  <span>{item.label}</span>
                  <span className="font-mono text-gray-900">{item.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-bold text-gray-900">{brand} Models in the Database</h2>
          <Link href="/tools/drone-frequency-database" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            Open full database →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedDrones.map((drone) => (
            <DroneCard key={drone.id} drone={drone} />
          ))}
        </div>
      </section>

      <section className="border-t border-gray-200 pt-8 text-sm text-gray-500 leading-6">
        <p>
          CounterUAVHub summarizes public manufacturer pages, public regulatory references, and
          conservative RF profiles. Always confirm the exact regional model, firmware, antenna setup,
          and legal authority before using any RF reference in the field.
        </p>
      </section>
    </main>
  )
}
