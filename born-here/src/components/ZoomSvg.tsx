import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from 'react'
import { select } from 'd3-selection'
import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom'
import 'd3-transition'

export interface ZoomHandle {
  zoomTo: (bounds: [[number, number], [number, number]]) => void
  reset: () => void
  svg: () => SVGSVGElement | null
}

/** An SVG with pinch/scroll zoom and pan. Children are drawn in viewBox units. */
export const ZoomSvg = forwardRef<ZoomHandle, { width: number; height: number; children: ReactNode; label: string; onBackground?: () => void }>(
  function ZoomSvg({ width, height, children, label, onBackground }, ref) {
    const svgRef = useRef<SVGSVGElement>(null)
    const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null)
    const [t, setT] = useState<ZoomTransform>(zoomIdentity)

    useEffect(() => {
      const svg = svgRef.current!
      const z = zoom<SVGSVGElement, unknown>()
        .scaleExtent([1, 10])
        .translateExtent([
          [0, 0],
          [width, height],
        ])
        .extent([
          [0, 0],
          [width, height],
        ])
        // plain scroll keeps scrolling the page; ctrl/⌘+wheel or pinch zooms
        .filter((e: Event) => {
          const ev = e as WheelEvent & MouseEvent
          if (ev.type === 'wheel') return ev.ctrlKey || ev.metaKey
          if (ev.type === 'touchstart') return (e as TouchEvent).touches.length > 1 || t.k > 1
          return !ev.button
        })
        .on('zoom', (e) => setT(e.transform))
      zoomRef.current = z
      select(svg).call(z).on('dblclick.zoom', null)
      return () => {
        select(svg).on('.zoom', null)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [width, height, t.k > 1])

    useImperativeHandle(ref, () => ({
      zoomTo: ([[x0, y0], [x1, y1]]) => {
        const k = Math.min(8, 0.6 / Math.max((x1 - x0) / width, (y1 - y0) / height))
        const tr = zoomIdentity
          .translate(width / 2, height / 2)
          .scale(Math.max(1, k))
          .translate(-(x0 + x1) / 2, -(y0 + y1) / 2)
        select(svgRef.current!).transition().duration(700).call(zoomRef.current!.transform, tr)
      },
      reset: () => {
        select(svgRef.current!).transition().duration(500).call(zoomRef.current!.transform, zoomIdentity)
      },
      svg: () => svgRef.current,
    }))

    return (
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="map-svg block h-auto w-full"
          role="img"
          aria-label={label}
          onClick={(e) => {
            if (e.target === e.currentTarget) onBackground?.()
          }}
        >
          <g data-zoom transform={t.toString()}>
            {children}
          </g>
        </svg>
        {t.k > 1.01 && (
          <button
            onClick={() => zoomRef.current && select(svgRef.current!).transition().duration(500).call(zoomRef.current.transform, zoomIdentity)}
            className="absolute right-2 top-2 rounded-full border border-white/15 bg-black/70 px-3 py-1 text-xs text-neutral-200 backdrop-blur hover:bg-black"
          >
            Reset zoom
          </button>
        )}
      </div>
    )
  },
)
