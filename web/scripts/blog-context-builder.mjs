import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

const DEFAULT_REQUIRED_LINKS = [
  '/tools/drone-frequency-database',
  '/tools/jammer-calculator',
  '/tools/rf-detection-coverage-planner',
  '/blog/radar-vs-rf-drone-detection',
]

const EVERGREEN_GAPS = [
  {
    title: '900 MHz Drone Control Links and Counter-UAS Monitoring',
    reason: 'Sub-GHz control links appear in FPV, tactical, and long-range drone discussions but do not have a dedicated article yet.',
    keyword: '900 MHz drone control links',
  },
  {
    title: 'How to Evaluate Drone RF Source Confidence',
    reason: 'The site now labels official, FCC-backed, and public-estimate records; this deserves an explanatory SEO article.',
    keyword: 'drone RF source confidence',
  },
  {
    title: 'Remote ID, RF Detection, and Radar in Counter-UAS Workflows',
    reason: 'Remote ID and RF detection appear repeatedly in recent news and link naturally to existing tools and guides.',
    keyword: 'Remote ID RF detection counter UAS',
  },
]

export function slugifyTopic(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/counter uas/g, 'counter-uas')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
    .split('-')
    .slice(0, 12)
    .join('-')
}

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function readJson(filePath, fallback = []) {
  if (!fs.existsSync(filePath)) return fallback
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

export function readExistingPosts(blogDir = path.join(process.cwd(), 'content/blog')) {
  if (!fs.existsSync(blogDir)) return []

  return fs
    .readdirSync(blogDir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const raw = fs.readFileSync(path.join(blogDir, file), 'utf8')
      const { data } = matter(raw)
      return {
        slug: file.replace(/\.md$/, ''),
        title: normalizeText(data.title),
        date: normalizeText(data.date),
        excerpt: normalizeText(data.excerpt),
        keywords: normalizeText(data.keywords),
      }
    })
}

function newsTopicCandidates(newsItems) {
  return newsItems.slice(0, 12).flatMap((item) => {
    const haystack = `${item.title ?? ''} ${item.excerpt ?? ''} ${item.category ?? ''}`.toLowerCase()
    const candidates = []

    if (haystack.includes('remote id') || haystack.includes('identification')) {
      candidates.push({
        title: 'Remote ID and RF Detection for Counter-UAS Site Security',
        reason: `Recent source signal: ${normalizeText(item.title)}`,
        keyword: 'Remote ID counter-UAS detection',
      })
    }

    if (haystack.includes('airport') || haystack.includes('critical infrastructure')) {
      candidates.push({
        title: 'Counter-UAS Detection Layers for Airports and Critical Infrastructure',
        reason: `Recent source signal: ${normalizeText(item.title)}`,
        keyword: 'counter-UAS detection critical infrastructure',
      })
    }

    if (haystack.includes('rf') || haystack.includes('jamming') || haystack.includes('detection')) {
      candidates.push({
        title: 'RF Detection Clues That Matter in Counter-UAS Triage',
        reason: `Recent source signal: ${normalizeText(item.title)}`,
        keyword: 'RF detection counter-UAS triage',
      })
    }

    return candidates
  })
}

function droneStats(drones) {
  const brands = new Set()
  const categories = new Map()

  for (const drone of drones) {
    if (drone.brand) brands.add(drone.brand)
    const category = drone.category || 'unknown'
    categories.set(category, (categories.get(category) ?? 0) + 1)
  }

  return {
    total: drones.length,
    brands: brands.size,
    categories: [...categories.entries()].map(([category, count]) => ({ category, count })),
  }
}

export function buildBlogAutomationContext({
  existingPosts = [],
  newsItems = [],
  drones = [],
  now = new Date(),
} = {}) {
  const existingSlugs = new Set(existingPosts.map((post) => post.slug))
  const existingTitles = new Set(existingPosts.map((post) => normalizeText(post.title).toLowerCase()))
  const rawCandidates = [...newsTopicCandidates(newsItems), ...EVERGREEN_GAPS]
  const seen = new Set()

  const candidates = rawCandidates
    .map((candidate) => ({
      ...candidate,
      title: normalizeText(candidate.title),
      slug: slugifyTopic(candidate.title),
      score: candidate.reason.startsWith('Recent source signal') ? 90 : 75,
    }))
    .filter((candidate) => {
      const titleKey = candidate.title.toLowerCase()
      if (!candidate.slug || seen.has(candidate.slug)) return false
      seen.add(candidate.slug)
      return !existingSlugs.has(candidate.slug) && !existingTitles.has(titleKey)
    })
    .sort((a, b) => b.score - a.score)

  return {
    generatedDate: now.toISOString().slice(0, 10),
    site: 'CounterUAVHub',
    audience: 'engineers, security practitioners, RF researchers, and counter-UAS readers',
    existingPosts: existingPosts
      .map(({ slug, title, date, keywords }) => ({ slug, title, date, keywords }))
      .sort((a, b) => b.date.localeCompare(a.date)),
    recentNews: newsItems.slice(0, 8).map(({ title, source, date, category, url }) => ({ title, source, date, category, url })),
    droneStats: droneStats(drones),
    candidates,
    requiredInternalLinks: DEFAULT_REQUIRED_LINKS,
    safetyRules: [
      'Write only public, defensive, educational, and system-planning content.',
      'Do not provide operational jamming, spoofing, bypass, evasion, or attack instructions.',
      'Mark uncertain technical claims as public-source estimates and avoid pretending inferred data is official.',
      'Prefer system architecture, trade-offs, compliance, source confidence, and defensive workflow framing.',
    ],
  }
}

export function buildContextFromProject(projectRoot = process.cwd()) {
  const contentDir = path.join(projectRoot, 'content/blog')
  const dataDir = path.join(projectRoot, 'data')
  return buildBlogAutomationContext({
    existingPosts: readExistingPosts(contentDir),
    newsItems: readJson(path.join(dataDir, 'news.json'), []),
    drones: readJson(path.join(dataDir, 'drones.json'), []),
  })
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const context = buildContextFromProject(process.cwd())
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(context, null, 2))
  } else {
    console.log(`Generated ${context.candidates.length} blog candidate(s) for ${context.site}`)
    for (const candidate of context.candidates.slice(0, 8)) {
      console.log(`- ${candidate.title} (${candidate.slug})`)
    }
  }
}
