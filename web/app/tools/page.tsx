import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Counter-Drone RF Tools | CounterUAVHub',
  description:
    'Engineering calculators for counter-drone professionals. Compute jammer effective range, J/S ratio, RF detection range, and free space path loss.',
  openGraph: {
    title: 'Counter-Drone RF Tools',
    description:
      'Engineering calculators for C-UAS professionals: jammer range, J/S ratio, RF detection range, FSPL.',
    url: 'https://counteruavhub.com/tools',
  },
}

const tools = [
  {
    href: '/tools/drone-frequency-database',
    title: 'Drone Signal Database',
    description:
      'RF signal parameters for 27+ drone models — control frequency, video protocol, GPS bands, and recommended counter frequencies.',
    badge: 'Database',
    badgeColor: 'bg-blue-100 text-blue-800',
    icon: '📡',
  },
  {
    href: '/tools/jammer-calculator',
    title: 'Jammer Effectiveness Calculator',
    description:
      'Unified J/S ratio and effective range analysis. Enter the scenario geometry to get both the jamming ratio at your current position and the maximum range at which jamming succeeds. Includes FHSS bandwidth penalty.',
    badge: 'Calculator',
    badgeColor: 'bg-red-100 text-red-800',
    icon: '⚡',
  },
  {
    href: '/tools/rf-detection-range',
    title: 'RF Detection Range Calculator',
    description:
      'Calculate the maximum distance at which a passive RF sensor can detect a drone\'s transmitter, given receiver sensitivity, antenna gain, and drone EIRP.',
    badge: 'Calculator',
    badgeColor: 'bg-orange-100 text-orange-800',
    icon: '🔍',
  },
  {
    href: '/tools/fspl-calculator',
    title: 'Free Space Path Loss Calculator',
    description:
      'Compute RF signal attenuation over distance in free space. Foundational for link budget analysis, jammer sizing, and RF sensor planning.',
    badge: 'Calculator',
    badgeColor: 'bg-purple-100 text-purple-800',
    icon: '📉',
  },
]

export default function ToolsIndexPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Counter-Drone RF Tools</h1>
        <p className="text-lg text-gray-600 max-w-2xl">
          Engineering calculators and reference databases for C-UAS professionals. All calculators
          run client-side — no data is sent to any server.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group flex items-start gap-5 p-5 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <span className="text-2xl mt-0.5 select-none">{tool.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                  {tool.title}
                </h2>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tool.badgeColor}`}>
                  {tool.badge}
                </span>
              </div>
              <p className="text-sm text-gray-600">{tool.description}</p>
            </div>
            <span className="text-gray-400 group-hover:text-blue-500 transition-colors mt-1">→</span>
          </Link>
        ))}
      </div>

      <div className="mt-10 p-5 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-500">
        <p>
          <span className="font-medium text-gray-700">Methodology note:</span> All RF calculations
          use free-space propagation models (Friis transmission equation). Real-world results vary
          with terrain, multipath, atmospheric conditions, and antenna polarization. Use these
          results as first-order estimates for planning — not as operational guarantees.
        </p>
      </div>
    </main>
  )
}
