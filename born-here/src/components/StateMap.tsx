import { forwardRef, useMemo } from 'react'
import type { PersonEntry } from '../types'
import { buildLayout, calloutSides, layoutLabels, topoFeatures, type Shape } from '../lib/layout'
import { norm, type Topo } from '../lib/data'
import { FORCE_CALLOUT } from '../states'
import { ZoomSvg, type ZoomHandle } from './ZoomSvg'

interface Props {
  people: Map<string, PersonEntry>
  stateName: string
  activeIndex: number | null
  isDimmed: (p: PersonEntry | undefined) => boolean
  onHover: (i: number) => void
  onSelect: (i: number) => void
  onBackground: () => void
}

export function useStateLayout(topo: Topo, people: Map<string, PersonEntry>) {
  return useMemo(() => {
    const { features, adj } = topoFeatures(topo, 'districts')
    const force = (n: string) => FORCE_CALLOUT.has(n.toLowerCase())
    const text = (s: Shape) => people.get(norm(s.name))?.person || '?'
    const opts = { nameKey: 'district', forceCallout: force, maxHeight: 1400 }
    // pass 1: gutters on both sides; pass 2: keep only the gutters callouts actually use
    let layout = buildLayout(features, adj, opts)
    let labels = layoutLabels(layout, text, force, (s) => s.name)
    const sides = calloutSides(labels)
    if (sides[0] !== layout.marginL > 100 || sides[1] !== layout.marginR > 100) {
      layout = buildLayout(features, adj, { ...opts, gutters: sides })
      labels = layoutLabels(layout, text, force, (s) => s.name)
    }
    return { ...layout, labels }
  }, [topo, people])
}

const INK = '#141414'

export const StateMap = forwardRef<ZoomHandle, Props & { layout: ReturnType<typeof useStateLayout> }>(function StateMap(
  { layout, people, stateName, activeIndex, isDimmed, onHover, onSelect, onBackground },
  ref,
) {
  const personOf = (s: Shape) => people.get(norm(s.name))
  const labels = layout.labels
  const active = activeIndex != null ? layout.shapes[activeIndex] : null

  return (
    <ZoomSvg ref={ref} width={layout.width} height={layout.height} label={`District map of ${stateName}`} onBackground={onBackground}>
      <g>
        {layout.shapes.map((s) => {
          const p = personOf(s)
          return (
            <path
              key={s.index}
              className="region"
              d={s.d}
              fill={s.color}
              stroke="#0b0b0b"
              strokeWidth={0.9}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              opacity={isDimmed(p) ? 0.18 : 1}
              onPointerEnter={(e) => e.pointerType === 'mouse' && onHover(s.index)}
              onClick={() => onSelect(s.index)}
              tabIndex={0}
              role="button"
              aria-label={`${s.name}: ${p?.person || 'open slot'}`}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(s.index)}
            />
          )
        })}
      </g>
      {active && (
        <path
          data-noexport
          d={active.d}
          fill="none"
          stroke="#ffffff"
          strokeWidth={2.6}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />
      )}
      <g fontFamily="Inter, ui-sans-serif, system-ui, sans-serif" pointerEvents="none">
        {layout.shapes.map((s) => {
          const lab = labels.get(s.index)
          if (!lab) return null
          const p = personOf(s)
          const name = p?.person || ''
          const op = isDimmed(p) ? 0.25 : 1
          if (lab.mode === 'inside') {
            const lines = name ? lab.lines : ['?']
            const nameFs = name ? lab.fs : Math.min(lab.fs * 1.6, 20)
            const lh = nameFs * 1.08
            const slh = lab.subFs * 1.22
            const total = lines.length * lh + lab.subLines.length * slh
            const top = s.y - total / 2 + nameFs * 0.8
            const subTop = top + (lines.length - 1) * lh + nameFs * 0.25 + lab.subFs * 1.2
            return (
              <g key={s.index} opacity={op}>
                {lines.map((l, i) => (
                  <text key={i} x={s.x} y={top + i * lh} textAnchor="middle" fontSize={nameFs} fontWeight={name ? 700 : 800} fill={name ? INK : '#7a7a7a'}>
                    {l}
                  </text>
                ))}
                {lab.subLines.map((l, i) => (
                  <text key={'s' + i} x={s.x} y={subTop + i * slh} textAnchor="middle" fontSize={lab.subFs} fontWeight={600} letterSpacing="0.06em" fill="#3d3d3d">
                    {l}
                  </text>
                ))}
              </g>
            )
          }
          const anchor = lab.side === 'left' ? 'end' : 'start'
          const lx = lab.side === 'left' ? lab.x + 6 : lab.x - 6
          return (
            <g key={s.index} opacity={op}>
              <line x1={s.x} y1={s.y} x2={lx} y2={lab.y - 4} stroke="#8c8c8c" strokeWidth={0.8} vectorEffect="non-scaling-stroke" />
              <circle cx={s.x} cy={s.y} r={2.6} fill={INK} stroke="#ffffff" strokeWidth={0.8} />
              <text x={lab.x} y={lab.y} textAnchor={anchor} fontSize={13} fontWeight={700} fill={name ? '#ffffff' : '#8a8a8a'}>
                {name || '?'}
              </text>
              <text x={lab.x} y={lab.y + 11} textAnchor={anchor} fontSize={8} fontWeight={600} letterSpacing="0.08em" fill="#a3a3a3">
                {s.name.toUpperCase()}
              </text>
            </g>
          )
        })}
      </g>
      {/* invisible hit targets for callout labels so they are tappable too */}
      <g data-noexport>
        {layout.shapes.map((s) => {
          const lab = labels.get(s.index)
          if (!lab || lab.mode !== 'callout') return null
          const w = 150
          const x = lab.side === 'left' ? lab.x - w : lab.x
          return (
            <rect
              key={s.index}
              x={x}
              y={lab.y - 14}
              width={w}
              height={28}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onPointerEnter={(e) => e.pointerType === 'mouse' && onHover(s.index)}
              onClick={() => onSelect(s.index)}
            />
          )
        })}
      </g>
    </ZoomSvg>
  )
})
