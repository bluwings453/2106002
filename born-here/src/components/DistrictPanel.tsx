import type { PersonEntry } from '../types'
import { ConfidenceBadge } from './Badge'

interface Props {
  district: string
  color: string
  person: PersonEntry | undefined
  onClose: () => void
  onSuggest: () => void
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-white/5 py-2.5 text-sm">
      <dt className="shrink-0 text-neutral-500">{label}</dt>
      <dd className={`text-right ${value ? 'text-neutral-100' : 'text-neutral-600'}`}>{value || '—'}</dd>
    </div>
  )
}

export function DistrictPanel({ district, color, person, onClose, onSuggest }: Props) {
  const name = person?.person ?? ''
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <div
          className="flex size-16 shrink-0 items-center justify-center rounded-2xl text-xl font-extrabold text-black/70"
          style={{ background: color }}
          aria-hidden
        >
          {name ? initials(name) : '?'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">{district}</p>
          <h2 className={`mt-0.5 text-xl font-bold leading-tight ${name ? 'text-white' : 'text-neutral-500'}`}>
            {name || 'No clear pick yet'}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <ConfidenceBadge value={person?.confidence || (name ? '' : 'Open slot')} />
            {person?.category && (
              <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] text-neutral-300">
                {person.category}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="-mr-1 -mt-1 rounded-full p-1.5 text-neutral-500 hover:bg-white/5 hover:text-white"
          aria-label="Close"
        >
          <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M5 5l10 10M15 5L5 15" />
          </svg>
        </button>
      </div>

      {person?.knownFor ? (
        <p className="text-[15px] leading-snug text-neutral-200">{person.knownFor}</p>
      ) : (
        !name && (
          <p className="text-sm leading-snug text-neutral-500">
            Nobody has been placed here yet. Know someone famous who was born in {district}? Suggest them below.
          </p>
        )
      )}

      <dl>
        <Row label="Born in" value={person?.birthplace ?? ''} />
        <Row label="Birth year" value={person?.birthYear ?? ''} />
      </dl>

      {person?.note && (
        <div className="rounded-xl border border-[#f6eb9c]/20 bg-[#f6eb9c]/5 p-3 text-[13px] leading-snug text-neutral-300">
          <span className="font-semibold text-[#f6eb9c]">Note · </span>
          {person.note}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {person?.sourceUrl && (
          <a
            href={person.sourceUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3.5 py-1.5 text-sm text-neutral-200 hover:border-white/40"
          >
            Source ↗
          </a>
        )}
        <button
          onClick={onSuggest}
          className="inline-flex items-center rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-black hover:bg-neutral-200"
        >
          Suggest a change
        </button>
      </div>
    </div>
  )
}
