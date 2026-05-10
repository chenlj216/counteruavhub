import { Metadata } from 'next'
import DroneTable from '@/components/DroneTable'
import { drones } from '@/data/drones'

const droneCount = drones.length

export const metadata: Metadata = {
  title: 'Drone Frequency & Signal Database | CounterUAVHub',
  description: `Look up RF signal parameters for ${droneCount}+ drone models including DJI, Autel, Parrot, Skydio, industrial, tactical, and FPV systems. Find control frequencies, video protocols, and counter-drone jamming ranges.`,
  openGraph: {
    title: 'Drone Frequency & Signal Database',
    description: `RF signal parameters for ${droneCount}+ drone models. Find control frequencies, video protocols, GPS bands, and recommended counter-drone frequencies.`,
    url: 'https://counteruavhub.com/tools/drone-frequency-database',
  },
}

export default function DroneFrequencyDatabasePage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Drone Signal & Frequency Database
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl">
          Search and filter RF signal parameters for {droneCount}+ consumer, industrial, FPV, and military drones.
          Use this database to configure detection systems or identify jamming frequency requirements.
        </p>
      </div>

      {/* How to use */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <h2 className="font-semibold text-blue-800 mb-1 text-sm">Know the drone model?</h2>
          <p className="text-sm text-blue-700">Search by model name or brand to get full signal parameters including control frequency, video protocol, and GPS bands.</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
          <h2 className="font-semibold text-orange-800 mb-1 text-sm">Know the frequency band?</h2>
          <p className="text-sm text-orange-700">Filter by frequency band to see all drone models operating in that range — useful for configuring RF detection systems.</p>
        </div>
      </div>

      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'Drone Frequency & Signal Database',
            description: 'RF signal parameters for consumer, industrial, FPV and military drones',
            url: 'https://counteruavhub.com/tools/drone-frequency-database',
            applicationCategory: 'UtilitiesApplication',
            operatingSystem: 'Web',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <DroneTable />
    </main>
  )
}
