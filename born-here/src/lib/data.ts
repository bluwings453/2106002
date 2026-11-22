import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import type { PersonEntry, StateInfo } from '../types'

const BASE = import.meta.env.BASE_URL
const cache = new Map<string, Promise<unknown>>()

function getJSON<T>(path: string): Promise<T> {
  if (!cache.has(path)) {
    cache.set(
      path,
      fetch(BASE + path).then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${path}`)
        return r.json()
      }),
    )
  }
  return cache.get(path) as Promise<T>
}

export type Topo = Topology<{ [k: string]: GeometryCollection<Record<string, string>> }>

export const loadIndia = () => getJSON<Topo>('geo/india.topo.json')
export const loadStateList = () => getJSON<StateInfo[]>('geo/state-list.json')
export const loadStateTopo = (slug: string) => getJSON<Topo>(`geo/states/${slug}.topo.json`)

/** People data; a state without a file simply has every district as an open slot. */
export async function loadPeople(slug: string): Promise<PersonEntry[]> {
  try {
    return await getJSON<PersonEntry[]>(`data/${slug}.json`)
  } catch {
    cache.delete(`data/${slug}.json`)
    return []
  }
}

export { feature }

export const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
