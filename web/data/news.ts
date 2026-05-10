import newsData from './news.json'

export interface NewsItem {
  id: string
  title: string
  source: string
  date: string
  excerpt: string
  url: string
  category: 'incident' | 'technology' | 'regulation' | 'military' | 'market'
}

export const newsItems = newsData as NewsItem[]

export const categoryLabels: Record<NewsItem['category'], string> = {
  incident: 'Incident',
  technology: 'Technology',
  regulation: 'Regulation',
  military: 'Military',
  market: 'Market',
}

export const categoryColors: Record<NewsItem['category'], string> = {
  incident: 'bg-red-100 text-red-700',
  technology: 'bg-blue-100 text-blue-700',
  regulation: 'bg-yellow-100 text-yellow-700',
  military: 'bg-gray-100 text-gray-700',
  market: 'bg-green-100 text-green-700',
}
