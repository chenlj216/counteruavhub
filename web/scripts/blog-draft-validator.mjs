import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

const REQUIRED_FRONTMATTER = ['title', 'date', 'excerpt', 'keywords']

const UNSAFE_PATTERNS = [
  /\bhow to build (?:a )?(?:drone )?jammer\b/i,
  /\bset jammer power to\b/i,
  /\bexact jamming frequency\b/i,
  /\bspoof gps\b/i,
  /\bgnss spoofing steps\b/i,
  /\bbypass remote id\b/i,
  /\bevade counter[- ]uas\b/i,
  /\bdefeat a target link\b/i,
]

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function wordCount(value) {
  const matches = normalizeText(value).match(/\b[A-Za-z0-9][A-Za-z0-9-]*\b/g)
  return matches ? matches.length : 0
}

function extractInternalLinks(markdown) {
  const links = []
  for (const match of markdown.matchAll(/\[[^\]]+\]\((\/[^)\s]+)\)/g)) {
    links.push(match[1])
  }
  return [...new Set(links)]
}

export function readBlogSlugs(blogDir = path.join(process.cwd(), 'content/blog')) {
  if (!fs.existsSync(blogDir)) return []
  return fs
    .readdirSync(blogDir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => file.replace(/\.md$/, ''))
}

export function validateDraftMarkdown(markdown, {
  slug,
  existingSlugs = [],
  minWordCount = 650,
} = {}) {
  const errors = []
  const warnings = []
  const { data, content } = matter(markdown)
  const internalLinks = extractInternalLinks(content)

  for (const field of REQUIRED_FRONTMATTER) {
    if (!normalizeText(data[field])) errors.push(`Missing frontmatter field: ${field}`)
  }

  if (slug && existingSlugs.includes(slug)) errors.push(`Duplicate blog slug: ${slug}`)

  if (data.date && !/^\d{4}-\d{2}-\d{2}$/.test(String(data.date))) {
    errors.push('Frontmatter date must use YYYY-MM-DD format')
  }

  const words = wordCount(content)
  if (words < minWordCount) errors.push(`Draft is too short: ${words} words, expected at least ${minWordCount}`)

  for (const pattern of UNSAFE_PATTERNS) {
    if (pattern.test(markdown)) errors.push(`Found unsafe operational pattern: ${pattern}`)
  }

  if (internalLinks.length < 2) warnings.push('Draft should include at least two internal links')
  if (!internalLinks.some((link) => link.startsWith('/tools/'))) warnings.push('Draft should link to at least one tool page')

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    frontmatter: data,
    internalLinks,
    wordCount: words,
  }
}

export function validateDraftFile(filePath, options = {}) {
  const markdown = fs.readFileSync(filePath, 'utf8')
  const slug = options.slug ?? path.basename(filePath, '.md')
  return validateDraftMarkdown(markdown, { ...options, slug })
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const filePath = process.argv[2]
  if (!filePath) {
    console.error('Usage: node scripts/blog-draft-validator.mjs <draft-file>')
    process.exit(2)
  }

  const blogDir = path.dirname(filePath)
  const slug = path.basename(filePath, '.md')
  const existingSlugs = readBlogSlugs(blogDir).filter((existing) => existing !== slug)
  const result = validateDraftFile(filePath, { slug, existingSlugs })
  console.log(JSON.stringify(result, null, 2))
  if (!result.valid) process.exit(1)
}
