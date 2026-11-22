import { useMemo, useState } from 'react'
import type { StateInfo } from '../types'
import { buildLayout, layoutLabels, topoFeatures } from '../lib/layout'
import type { Topo } from '../lib/data'
import { href } from '../lib/router'
import { ZoomSvg } from './ZoomSvg'

interface Props {
  topo: Topo
  states: StateInfo[]
  featured: Set<string>
}

const SHORT: Record<string, string> = {
  'Andaman and Nicobar Islands': 'Andaman & Nicobar',
  'Dadra and Nagar Haveli and Daman and Diu': 'DNH & DD',
  'Jammu and Kashmir': 'Jammu & Kashmir',
}

export function IndiaMap({ topo, states, featured }: Props) {
  const slugOf = useMemo(() => new Map(states.map((s) => [s.name, s.slug])), [states])
  const layout = useMemo(() => {
    const { features, adj } = topoFeatures(topo, 'states')
    return buildLayout(features, adj, { nameKey: 'st_nm', gutter: false })
  }, [topo])
  const labels = useMemo(() => layoutLabels(layout, (s) => SHORT[s.name] ?? s.name, () => false, () => ''), [layout])
  const [hover, setHover] = useState<number | null>(null)
  const hovered = hover != null ? layout.shapes[hover] : null

  return (
    <div className="relative">
      <ZoomSvg width={layout.width} height={layout.height} label="Map of India by state">
        {layout.shapes.map((s) => {
          const slug = slugOf.get(s.name)
          return (
            <a key={s.index} href={slug ? href.state(slug) : undefined} aria-label={s.name}>
              <path
                className="region"
                d={s.d}
                fill={s.color}
                stroke="#0b0b0b"
                strokeWidth={0.9}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                
                onPointerEnter={() => setHover(s.index)}
                onPointerLeave={() => setHover((h) => (h === s.index ? null : h))}
              />
            </a>
          )
        })}
        {hovered && (
          <path d={hovered.d} fill="none" stroke="#fff" strokeWidth={2.4} vectorEffect="non-scaling-stroke" pointerEvents="none" />
        )}
        <g fontFamily="Inter, sans-serif" pointerEvents="none">
          {layout.shapes.map((s) => {
            const lab = labels.get(s.index)
            const slug = slugOf.get(s.name)
            const isFeatured = slug ? featured.has(slug) : false
            if (!lab || lab.mode !== 'inside') return null
            const fs = Math.min(lab.fs, 15)
            return (
              <g key={s.index}>
                {lab.lines.map((l, i) => (
                  <text
                    key={i}
                    x={s.x}
                    y={s.y + (i - (lab.lines.length - 1) / 2) * fs * 1.1 + fs * 0.35}
                    textAnchor="middle"
                    fontSize={fs}
                    fontWeight={isFeatured ? 800 : 600}
                    fill={isFeatured ? '#111' : '#2b2b2b'}
                  >
                    {l}
                  </text>
                ))}
                {isFeatured && (
                  <text x={s.x} y={s.y + ((lab.lines.length + 1) / 2) * fs * 1.1 + 4} textAnchor="middle" fontSize={Math.max(6, fs * 0.55)} fontWeight={700} letterSpacing="0.1em" fill="#111">
                    ● EXPLORE
                  </text>
                )}
              </g>
            )
          })}
        </g>
      </ZoomSvg>
      <div className="pointer-events-none absolute left-0 top-0 min-h-6 text-sm text-neutral-300" aria-live="polite">
        {hovered ? (
          <span>
            <span className="font-semibold text-white">{hovered.name}</span>
            <span className="text-neutral-500"> · tap to open</span>
          </span>
        ) : null}
      </div>
    </div>
  )
}
