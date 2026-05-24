import { getSourceConfidence } from './source-confidence.mjs'

const CATEGORY_LABELS = {
  consumer: 'Consumer',
  industrial: 'Industrial',
  fpv: 'FPV',
  military: 'Military',
}

export function getBrandSlug(brand) {
  return String(brand ?? '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getBrandFromSlug(drones, slug) {
  const normalizedSlug = String(slug ?? '')
  const brands = [...new Set(drones.map((drone) => drone.brand))]

  return brands.find((brand) => getBrandSlug(brand) === normalizedSlug) ?? null
}

export function filterDronesForBrand(drones, slug) {
  const brand = getBrandFromSlug(drones, slug)
  if (!brand) return []

  return drones.filter((drone) => drone.brand === brand)
}

function countBy(items, getKey) {
  const counts = new Map()
  for (const item of items) {
    const key = getKey(item)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

export function summarizeBrandDrones(drones) {
  return {
    total: drones.length,
    categories: countBy(drones, (drone) => CATEGORY_LABELS[drone.category] ?? drone.category),
    sourceConfidence: countBy(drones, (drone) => getSourceConfidence(drone).label),
  }
}

export function getBrandSummaries(drones) {
  return [...new Set(drones.map((drone) => drone.brand))]
    .map((brand) => {
      const brandDrones = drones.filter((drone) => drone.brand === brand)
      const summary = summarizeBrandDrones(brandDrones)

      return {
        brand,
        slug: getBrandSlug(brand),
        count: brandDrones.length,
        topCategory: summary.categories[0]?.label ?? 'Mixed',
        sourceConfidence: summary.sourceConfidence,
      }
    })
    .sort((a, b) => b.count - a.count || a.brand.localeCompare(b.brand))
}
