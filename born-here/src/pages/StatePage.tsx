import { useEffect, useMemo, useRef, useState } from 'react'
import { DistrictPanel } from '../components/DistrictPanel'
import { StateMap, useStateLayout } from '../components/StateMap'
import { SuggestForm } from '../components/SuggestForm'
import type { ZoomHandle } from '../components/ZoomSvg'
import { loadPeople, loadStateList, loadStateTopo, norm, type Topo } from '../lib/data'
import { exportMapPng } from '../lib/exportPng'
import { href } from '../lib/router'
import { FEATURED_STATES } from '../states'
import { CATEGORIES, type Category, type PersonEntry, type StateInfo } from '../types'

function useIsDesktop() {
  const q = '(min-width: 1024px) and (hover: hover)'
  const [v, setV] = useState(() => window.matchMedia(q).matches)
  useEffect(() => {
    const m = window.matchMedia(q)
    const on = () => setV(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return v
}

function StateSwitcher({ slug, all }: { slug: string; all: StateInfo[] }) {
  const featured = new Set(FEATURED_STATES.map((s) => s.slug))
  const others = all.filter((s) => !featured.has(s.slug)).sort((a, b) => a.name.localeCompare(b.name))
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
      <div className="flex shrink-0 rounded-full border border-white/10 bg-white/[0.03] p-1">
        {FEATURED_STATES.map((s) => (
          <a
            key={s.slug}
            href={href.state(s.slug)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              s.slug === slug ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
            }`}
          >
            {s.name}
          </a>
        ))}
      </div>
      <select
        aria-label="More states"
        value={featured.has(slug) ? '' : slug}
        onChange={(e) => e.target.value && (window.location.hash = href.state(e.target.value))}
        className="shrink-0 rounded-full border border-white/10 bg-[#111] px-3 py-2 text-sm text-neutral-300 outline-none hover:border-white/30"
      >
        <option value="">More states…</option>
        {others.map((s) => (
          <option key={s.slug} value={s.slug}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  )
}

function Loaded({ slug, name, topo, rows }: { slug: string; name: string; topo: Topo; rows: PersonEntry[] }) {
  const people = useMemo(() => new Map(rows.map((r) => [norm(r.district), r])), [rows])
  const layout = useStateLayout(topo, people)
  const isDesktop = useIsDesktop()
  const mapRef = useRef<ZoomHandle>(null)
  const [active, setActive] = useState<number | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [filter, setFilter] = useState<Category | null>(null)
  const [query, setQuery] = useState('')
  const [searchMsg, setSearchMsg] = useState('')
  const [suggestFor, setSuggestFor] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [poster, setPoster] = useState<{ url: string; filename: string } | null>(null)
  const [exportErr, setExportErr] = useState('')

  const filled = layout.shapes.filter((s) => people.get(norm(s.name))?.person).length
  const activeShape = active != null ? layout.shapes[active] : null
  const activePerson = activeShape ? people.get(norm(activeShape.name)) : undefined

  const options = useMemo(() => {
    const o = new Set<string>()
    for (const s of layout.shapes) {
      o.add(s.name)
      const p = people.get(norm(s.name))?.person
      if (p) o.add(p)
    }
    return [...o].sort()
  }, [layout, people])

  const runSearch = (q: string) => {
    const n = norm(q)
    if (!n) return
    const score = (s: (typeof layout.shapes)[number]) => {
      const d = norm(s.name)
      const p = norm(people.get(d)?.person ?? '')
      if (d === n || p === n) return 3
      if (d.startsWith(n) || p.startsWith(n)) return 2
      if (d.includes(n) || (p && p.includes(n))) return 1
      return 0
    }
    const best = [...layout.shapes].sort((a, b) => score(b) - score(a))[0]
    if (!best || score(best) === 0) {
      setSearchMsg(`No district or person matching “${q}”`)
      return
    }
    setSearchMsg('')
    setActive(best.index)
    setSheetOpen(true)
    mapRef.current?.zoomTo(best.bounds)
  }

  const isDimmed = (p: PersonEntry | undefined) => !!filter && p?.category !== filter

  const panel = activeShape ? (
    <DistrictPanel
      district={activeShape.name}
      color={activeShape.color}
      person={activePerson}
      onClose={() => {
        setActive(null)
        setSheetOpen(false)
      }}
      onSuggest={() => setSuggestFor(activeShape.name)}
    />
  ) : (
    <div className="flex flex-col gap-2 text-sm text-neutral-500">
      <p className="font-semibold text-neutral-300">Hover a district</p>
      <p>See who was born there, where exactly, and how sure we are.</p>
    </div>
  )

  return (
    <>
      <section className="mt-6 text-center">
        <h1 className="mx-auto max-w-3xl text-balance text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
          The Most Famous Person Born in Every District of {name}
        </h1>
        <p className="mt-2 text-sm text-neutral-400 sm:text-base">
          Birthplaces mapped to present-day districts · {filled} of {layout.shapes.length} filled
        </p>
      </section>

      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <form
          className="relative w-full lg:max-w-xs"
          onSubmit={(e) => {
            e.preventDefault()
            runSearch(query)
          }}
        >
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSearchMsg('')
              if (options.includes(e.target.value)) runSearch(e.target.value)
            }}
            list={`opts-${slug}`}
            type="search"
            placeholder="Search a person or district"
            className="w-full rounded-full border border-white/10 bg-[#111] py-2.5 pl-10 pr-4 text-[15px] text-white outline-none placeholder:text-neutral-500 focus:border-white/40"
          />
          <svg className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-neutral-500" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="9" r="6" />
            <path d="M14 14l4 4" />
          </svg>
          <datalist id={`opts-${slug}`}>
            {options.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
          {searchMsg && <p className="absolute left-4 top-full mt-1 text-xs text-[#f6c9cc]">{searchMsg}</p>}
        </form>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none lg:mx-0 lg:flex-wrap lg:justify-end lg:px-0">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setFilter((f) => (f === c ? null : c))}
              aria-pressed={filter === c}
              className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-[13px] transition ${
                filter === c ? 'border-white bg-white font-semibold text-black' : 'border-white/10 text-neutral-300 hover:border-white/30'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <StateMap
            ref={mapRef}
            layout={layout}
            people={people}
            stateName={name}
            activeIndex={active}
            isDimmed={isDimmed}
            onHover={(i) => isDesktop && setActive(i)}
            onSelect={(i) => {
              setActive(i)
              setSheetOpen(true)
            }}
            onBackground={() => {
              setActive(null)
              setSheetOpen(false)
            }}
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500">
            <span>Pinch or ⌘/Ctrl + scroll to zoom · ? = no clear pick</span>
            <button
              disabled={exporting}
              onClick={async () => {
                const svg = mapRef.current?.svg()
                if (!svg) return
                setExporting(true)
                setExportErr('')
                try {
                  const out = await exportMapPng(svg, name, `Birthplaces mapped to present-day districts${filter ? ` · ${filter}` : ''}`)
                  setPoster(out)
                  // Try a direct download too; some embedded viewers block it, so the preview stays open either way.
                  try {
                    const a = document.createElement('a')
                    a.href = out.url
                    a.download = out.filename
                    document.body.appendChild(a)
                    a.click()
                    a.remove()
                  } catch {
                    /* preview modal covers this */
                  }
                } catch (e) {
                  setExportErr(`Couldn’t create the image: ${String(e)}`)
                } finally {
                  setExporting(false)
                }
              }}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-neutral-200 hover:border-white/40 disabled:opacity-50"
            >
              <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M10 3v10m0 0l-4-4m4 4l4-4M4 16h12" />
              </svg>
              {exporting ? 'Preparing…' : 'Download as image'}
            </button>
          </div>
          {exportErr && <p className="mt-2 text-right text-xs text-[#f6c9cc]">{exportErr}</p>}
        </div>

        {isDesktop && (
          <aside className="sticky top-4 self-start rounded-3xl border border-white/10 bg-panel p-5">{panel}</aside>
        )}
      </div>

      {!isDesktop && sheetOpen && activeShape && (
        <div className="fixed inset-x-0 bottom-0 z-40 max-h-[58vh] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-panel p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-20px_60px_rgba(0,0,0,0.6)]">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" aria-hidden />
          <div className="mx-auto max-w-lg">{panel}</div>
        </div>
      )}

      {poster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setPoster(null)}>
          <div className="flex max-h-full w-full max-w-3xl flex-col gap-3 overflow-y-auto rounded-3xl border border-white/10 bg-[#141414] p-4" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Map image">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-neutral-300">
                <span className="font-semibold text-white">Your map image.</span> If the download didn’t start, right-click or long-press the image and save it.
              </p>
              <button onClick={() => setPoster(null)} className="shrink-0 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-black">
                Close
              </button>
            </div>
            <img src={poster.url} alt={`Poster: the most famous person born in every district of ${name}`} className="w-full rounded-xl" />
          </div>
        </div>
      )}

      {suggestFor && <SuggestForm state={name} district={suggestFor} onClose={() => setSuggestFor(null)} />}
    </>
  )
}

export function StatePage({ slug }: { slug: string }) {
  const [all, setAll] = useState<StateInfo[]>([])
  const [topo, setTopo] = useState<Topo | null>(null)
  const [rows, setRows] = useState<PersonEntry[]>([])
  const [err, setErr] = useState('')
  useEffect(() => {
    Promise.all([loadStateList(), loadStateTopo(slug), loadPeople(slug)])
      .then(([a, t, r]) => {
        setAll(a)
        setTopo(t)
        setRows(r)
      })
      .catch(() => setErr('We don’t have a map for this state.'))
  }, [slug])
  const name = all.find((s) => s.slug === slug)?.name ?? FEATURED_STATES.find((s) => s.slug === slug)?.name ?? ''

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-5 sm:px-6">
      <StateSwitcher slug={slug} all={all} />
      {err && <p className="py-24 text-center text-neutral-500">{err}</p>}
      {!err && !topo && <div className="mt-10 aspect-[4/3] w-full animate-pulse rounded-3xl bg-white/[0.03]" />}
      {topo && name && <Loaded slug={slug} name={name} topo={topo} rows={rows} />}
    </main>
  )
}
