import type { StateInfo } from './types'

/**
 * States that have a people data file in public/data/<slug>.json.
 * They appear as tabs in the state switcher. To add a state, drop its JSON
 * file in public/data and add it here. (Every state's district map already
 * ships in public/geo/states.)
 */
export const FEATURED_STATES: StateInfo[] = [
  { name: 'Telangana', slug: 'telangana' },
  { name: 'Uttar Pradesh', slug: 'uttar-pradesh' },
]

/** Districts that always get an outside label with a leader line. */
export const FORCE_CALLOUT = new Set(
  ['Hyderabad', 'Ghaziabad', 'Hapur', 'Shamli', 'Baghpat', 'Gautam Buddha Nagar', 'Chandauli'].map((d) =>
    d.toLowerCase(),
  ),
)
