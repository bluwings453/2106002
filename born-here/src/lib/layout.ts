import { geoArea, geoMercator, geoPath } from 'd3-geo'
import { feature, neighbors } from 'topojson-client'
import polylabel from 'polylabel'
import type { Feature, FeatureCollection, Geometry, Polygon, MultiPolygon, Position } from 'geojson'
import type { Topo } from './data'

export const PALETTE = ['#f6c9cc', '#cfe8b4', '#f6eb9c', '#dcc8f2'] as const

type Props = Record<string, string>
export type GeoFeature = Feature<Geometry, Props>

/** d3-geo wants clockwise exterior rings; flip any feature that came out inside-out. */
function rewind(f: GeoFeature): GeoFeature {
  if (geoArea(f) <= 2 * Math.PI) return f
  const g = f.geometry
  if (g.type === 'Polygon') g.coordinates = g.coordinates.map((r) => r.slice().reverse())
  if (g.type === 'MultiPolygon') g.coordinates = g.coordinates.map((p) => p.map((r) => r.slice().reverse()))
  return f
}

export function topoFeatures(topo: Topo, object: string): { features: GeoFeature[]; adj: number[][] } {
  const obj = topo.objects[object]
  const fc = feature(topo, obj) as unknown as FeatureCollection<Geometry, Props>
  const adj = neighbors(obj.geometries as never) as number[][]
  return { features: fc.features.map(rewind), adj }
}

/** 4-colour the adjacency graph (DSatur ordering + backtracking). Falls back to greedy if stuck. */
export function fourColor(adj: number[][], k = 4): number[] {
  const n = adj.length
  const color = new Array<number>(n).fill(-1)
  const order = [...Array(n).keys()].sort((a, b) => adj[b].length - adj[a].length)
  let steps = 0
  const pick = (): number => {
    let best = -1
    let bestSat = -1
    let bestDeg = -1
    for (const v of order) {
      if (color[v] !== -1) continue
      const sat = new Set(adj[v].map((u) => color[u]).filter((c) => c >= 0)).size
      if (sat > bestSat || (sat === bestSat && adj[v].length > bestDeg)) {
        best = v
        bestSat = sat
        bestDeg = adj[v].length
      }
    }
    return best
  }
  const solve = (): boolean => {
    if (++steps > 200000) return false
    const v = pick()
    if (v === -1) return true
    const used = new Set(adj[v].map((u) => color[u]))
    for (let c = 0; c < k; c++) {
      if (used.has(c)) continue
      color[v] = c
      if (solve()) return true
    }
    color[v] = -1
    return false
  }
  if (!solve()) {
    for (const v of order) {
      const used = new Set(adj[v].map((u) => color[u]))
      let c = 0
      while (used.has(c) && c < k - 1) c++
      color[v] = c
    }
  }
  return color
}

/** Pole of inaccessibility of the largest polygon, in projected coordinates. */
function labelPoint(f: GeoFeature, project: (p: [number, number]) => [number, number] | null) {
  const g = f.geometry as Polygon | MultiPolygon
  const polys: Position[][][] = g.type === 'Polygon' ? [g.coordinates] : g.coordinates
  let best = { x: 0, y: 0, r: -1 }
  for (const poly of polys) {
    const rings = poly.map((ring) => ring.map((p) => project(p as [number, number]) ?? [0, 0]))
    const pt = polylabel(rings as [number, number][][], 0.5) as unknown as [number, number] & { distance: number }
    if (pt.distance > best.r) best = { x: pt[0], y: pt[1], r: pt.distance }
  }
  return best
}

export type Label =
  | { mode: 'inside'; fs: number; lines: string[]; subFs: number; subLines: string[] }
  | { mode: 'callout'; side: 'left' | 'right'; x: number; y: number }

export interface Shape {
  index: number
  name: string
  d: string
  color: string
  x: number
  y: number
  r: number
  bounds: [[number, number], [number, number]]
}

export interface MapLayout {
  width: number
  height: number
  shapes: Shape[]
  marginX: number
  marginL: number
  marginR: number
}

export const MAP_WIDTH = 1000

export function buildLayout(
  features: GeoFeature[],
  adj: number[][],
  opts: { forceCallout?: (name: string) => boolean; nameKey: string; maxHeight?: number; gutter?: boolean; gutters?: [boolean, boolean] },
): MapLayout {
  const fc = { type: 'FeatureCollection', features } as FeatureCollection<Geometry, Props>
  const W = MAP_WIDTH
  const marginY = 24
  // Rough pass to know whether callout gutters are needed.
  const rough = geoMercator().fitWidth(W - 60, fc)
  const roughPath = geoPath(rough)
  const needsGutter = opts.gutter !== false && features.some((f) => {
    const name = f.properties[opts.nameKey]
    if (opts.forceCallout?.(name)) return true
    const a = roughPath.area(f)
    return a < 900
  })
  const G = 180
  const [gl, gr] = opts.gutters ?? [needsGutter, needsGutter]
  const marginL = gl ? G : 30
  const marginR = gr ? G : 30
  const marginX = Math.max(marginL, marginR)
  const inner = W - marginL - marginR
  const fitW = geoMercator().fitWidth(inner, fc)
  const [[, y0], [, y1]] = geoPath(fitW).bounds(fc)
  let height = Math.ceil(y1 - y0) + marginY * 2
  if (opts.maxHeight && height > opts.maxHeight) height = opts.maxHeight
  const projection = geoMercator().fitExtent(
    [
      [marginL, marginY],
      [W - marginR, height - marginY],
    ],
    fc,
  )
  const path = geoPath(projection)
  const colors = fourColor(adj)
  const shapes = features.map((f, i) => {
    const lp = labelPoint(f, (p) => projection(p) as [number, number] | null)
    return {
      index: i,
      name: f.properties[opts.nameKey],
      d: path(f) ?? '',
      color: PALETTE[colors[i] ?? 0],
      x: lp.x,
      y: lp.y,
      r: lp.r,
      bounds: path.bounds(f) as [[number, number], [number, number]],
    }
  })
  return { width: W, height, shapes, marginX, marginL, marginR }
}

function splitTwo(text: string): string[] {
  const words = text.split(' ')
  if (words.length < 2) return [text]
  let best = 1
  let bestDiff = Infinity
  for (let i = 1; i < words.length; i++) {
    const diff = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length)
    if (diff < bestDiff) {
      bestDiff = diff
      best = i
    }
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')]
}

const NAME_W = 0.6 // bold Inter, avg advance per char (em)
const SUB_W = 0.74 // uppercase + letter-spacing

/** Size the bold name + small uppercase district so both fit in a circle of radius r. */
function fitBlock(name: string, sub: string, r: number, maxFs: number) {
  const w = r * 2.3
  let best = { fs: 0, subFs: 0, lines: [name], subLines: [sub] }
  for (const lines of name.includes(' ') ? [[name], splitTwo(name)] : [[name]]) {
    for (const subLines of sub.includes(' ') && sub ? [[sub], splitTwo(sub)] : [[sub]]) {
      const nl = Math.max(...lines.map((l) => l.length), 1)
      const sl = Math.max(...subLines.map((l) => l.length), 1)
      let fs = Math.min(maxFs, w / (nl * NAME_W))
      let subFs = Math.min(fs * 0.6, w / (sl * SUB_W))
      fs = Math.min(fs, subFs / 0.45) // keep the hierarchy sane
      const h = lines.length * fs * 1.1 + subLines.length * subFs * 1.25
      const k = Math.min(1, (r * 2.1) / h)
      fs *= k
      subFs *= k
      if (fs > best.fs) best = { fs, subFs, lines, subLines }
    }
  }
  return best
}

export const MIN_FS = 6.5

/** Decide for each shape whether its label fits inside, else route it to a side gutter. */
export function calloutSides(labels: Map<number, Label>): [boolean, boolean] {
  let l = false
  let r = false
  for (const v of labels.values()) if (v.mode === 'callout') v.side === 'left' ? (l = true) : (r = true)
  return [l, r]
}

export function layoutLabels(
  layout: MapLayout,
  textFor: (s: Shape) => string,
  forceCallout: (name: string) => boolean,
  subFor: (s: Shape) => string = () => '',
): Map<number, Label> {
  const out = new Map<number, Label>()
  const callouts: Shape[] = []
  for (const s of layout.shapes) {
    const t = fitBlock(textFor(s), subFor(s).toUpperCase(), s.r, 15)
    if (forceCallout(s.name) || t.fs < MIN_FS || t.subFs < 4.6 || s.r < 9) callouts.push(s)
    else out.set(s.index, { mode: 'inside', ...t })
  }
  const mid = (layout.marginL + layout.width - layout.marginR) / 2
  const rowH = 30
  const hasL = layout.marginL > 100
  const hasR = layout.marginR > 100
  const sideOf = (s: Shape): 'left' | 'right' => {
    const pref = s.x < mid ? 'left' : 'right'
    if (pref === 'left' && !hasL && hasR) return 'right'
    if (pref === 'right' && !hasR && hasL) return 'left'
    return pref
  }
  for (const side of ['left', 'right'] as const) {
    const items = callouts.filter((s) => sideOf(s) === side).sort((a, b) => a.y - b.y)
    const ys = items.map((s) => s.y)
    for (let i = 1; i < ys.length; i++) ys[i] = Math.max(ys[i], ys[i - 1] + rowH)
    const maxY = layout.height - 16
    if (ys.length && ys[ys.length - 1] > maxY) {
      ys[ys.length - 1] = maxY
      for (let i = ys.length - 2; i >= 0; i--) ys[i] = Math.min(ys[i], ys[i + 1] - rowH)
    }
    items.forEach((s, i) => {
      const x = side === 'left' ? layout.marginL - 18 : layout.width - layout.marginR + 18
      out.set(s.index, { mode: 'callout', side, x, y: Math.max(14, ys[i]) })
    })
  }
  return out
}
