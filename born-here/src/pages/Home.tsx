import { useEffect, useState } from 'react'
import { IndiaMap } from '../components/IndiaMap'
import { loadIndia, loadStateList, type Topo } from '../lib/data'
import { href } from '../lib/router'
import { FEATURED_STATES } from '../states'
import type { StateInfo } from '../types'

export function Home() {
  const [topo, setTopo] = useState<Topo | null>(null)
  const [states, setStates] = useState<StateInfo[]>([])
  const [err, setErr] = useState('')
  useEffect(() => {
    Promise.all([loadIndia(), loadStateList()])
      .then(([t, s]) => {
        setTopo(t)
        setStates(s)
      })
      .catch((e) => setErr(String(e)))
  }, [])
  const featured = new Set(FEATURED_STATES.map((s) => s.slug))

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
      <section className="mx-auto max-w-2xl pb-6 pt-10 text-center sm:pt-14">
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">Born Here</h1>
        <p className="mt-3 text-base text-neutral-400 sm:text-lg">
          The most famous person born in every district. Birthplaces mapped to present-day districts.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {FEATURED_STATES.map((s) => (
            <a
              key={s.slug}
              href={href.state(s.slug)}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-neutral-200"
            >
              {s.name} →
            </a>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl">
        {err && <p className="py-20 text-center text-neutral-500">Couldn’t load the map. {err}</p>}
        {!topo && !err && <div className="aspect-square w-full animate-pulse rounded-3xl bg-white/[0.03]" />}
        {topo && <IndiaMap topo={topo} states={states} featured={featured} />}
        <p className="mt-4 text-center text-xs text-neutral-500">
          Tap any state to open its district map. States marked ● Explore have picks so far; the rest are open slots.
        </p>
      </section>
    </main>
  )
}
