import { Metadata } from 'next'
import Link from 'next/link'
import RFCoveragePlanner from '@/components/RFCoveragePlanner'
import { drones } from '@/data/drones'

export const metadata: Metadata = {
  title: 'RF Detection Coverage Planner',
  description:
    'Plan passive drone RF detection coverage with link budget range, radio horizon, multi-sensor area, environment loss, and confidence checks.',
  keywords:
    'RF detection coverage planner, drone RF detection range, passive RF sensor coverage, counter-UAS RF planning, drone signal coverage calculator',
  openGraph: {
    title: 'RF Detection Coverage Planner',
    description:
      'Estimate passive RF sensor coverage for drone detection planning using public signal references and first-order engineering models.',
    url: 'https://counteruavhub.com/tools/rf-detection-coverage-planner',
    type: 'website',
  },
}

export default function RFDetectionCoveragePlannerPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'RF Detection Coverage Planner',
    applicationCategory: 'EngineeringApplication',
    operatingSystem: 'Web',
    url: 'https://counteruavhub.com/tools/rf-detection-coverage-planner',
    description:
      'Client-side engineering calculator for passive drone RF detection coverage planning.',
    provider: {
      '@type': 'Organization',
      name: 'CounterUAVHub',
      url: 'https://counteruavhub.com',
    },
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <span>/</span>
        <Link href="/tools" className="hover:text-blue-600">Tools</Link>
        <span>/</span>
        <span className="text-gray-900">RF Detection Coverage Planner</span>
      </nav>

      <header className="mb-8">
        <p className="text-sm font-semibold text-orange-600 mb-2">Passive RF Detection Tool</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          RF Detection Coverage Planner
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl">
          Estimate passive drone RF detection coverage from public signal references, receiver
          sensitivity, antenna gain, site geometry, radio horizon, and environmental loss. The model
          is intended for lawful engineering planning and early site design.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="border border-gray-200 rounded-lg p-5 bg-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Input data</p>
          <p className="text-sm text-gray-700">
            Uses {drones.length}+ public drone RF profiles or a custom emitter reference.
          </p>
        </div>
        <div className="border border-gray-200 rounded-lg p-5 bg-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Model scope</p>
          <p className="text-sm text-gray-700">
            Combines free-space link budget, site loss, margin, and radio horizon constraints.
          </p>
        </div>
        <div className="border border-gray-200 rounded-lg p-5 bg-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Privacy</p>
          <p className="text-sm text-gray-700">
            Runs fully client-side. Scenario inputs are not sent to CounterUAVHub servers.
          </p>
        </div>
      </section>

      <section className="mb-8 bg-gray-50 border border-gray-200 rounded-xl p-5 text-sm text-gray-600 leading-6">
        <p>
          This planner does not identify drones, control RF systems, or provide operational
          countermeasure instructions. Treat the output as a first-order coverage estimate and
          validate it with spectrum surveys, controlled tests, local regulations, and site-specific
          engineering review.
        </p>
      </section>

      <RFCoveragePlanner />
    </main>
  )
}
