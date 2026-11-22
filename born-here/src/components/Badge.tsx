import type { Confidence } from '../types'

const STYLE: Record<Confidence, string> = {
  Verified: 'bg-[#cfe8b4] text-[#1f3a10]',
  Disputed: 'bg-[#f6eb9c] text-[#4a3d00]',
  Legendary: 'bg-[#dcc8f2] text-[#33175a]',
  'Open slot': 'bg-neutral-800 text-neutral-300 ring-1 ring-inset ring-neutral-700',
}

export function ConfidenceBadge({ value }: { value: Confidence | '' }) {
  const v: Confidence = value || 'Open slot'
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${STYLE[v]}`}>
      {v}
    </span>
  )
}
