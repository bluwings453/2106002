export const CATEGORIES = [
  'Politics',
  'Film & Music',
  'Literature',
  'Sports',
  'Freedom Struggle',
  'Religion & Spirituality',
  'Military',
] as const
export type Category = (typeof CATEGORIES)[number]

export const CONFIDENCE = ['Verified', 'Disputed', 'Legendary', 'Open slot'] as const
export type Confidence = (typeof CONFIDENCE)[number]

/** One row of public/data/<state>.json */
export interface PersonEntry {
  district: string
  person: string
  knownFor: string
  category: Category | ''
  birthplace: string
  birthYear: string
  confidence: Confidence | ''
  note: string
  sourceUrl: string
}

export interface StateInfo {
  name: string
  slug: string
}
