import { useState } from 'react'

const KEY = 'bornhere:suggestions'

export interface Suggestion {
  state: string
  district: string
  person: string
  birthplace: string
  sourceUrl: string
  createdAt: string
}

export function readSuggestions(): Suggestion[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

function save(s: Suggestion): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify([...readSuggestions(), s]))
    return true
  } catch {
    return false
  }
}

export function SuggestForm({ state, district, onClose }: { state: string; district: string; onClose: () => void }) {
  const [done, setDone] = useState<null | boolean>(null)
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-3xl border border-white/10 bg-[#141414] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Suggest a change for ${district}`}
      >
        {done === null ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const f = new FormData(e.currentTarget)
              setDone(
                save({
                  state,
                  district,
                  person: String(f.get('person') || '').trim(),
                  birthplace: String(f.get('birthplace') || '').trim(),
                  sourceUrl: String(f.get('sourceUrl') || '').trim(),
                  createdAt: new Date().toISOString(),
                }),
              )
            }}
            className="flex flex-col gap-4"
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                {district} · {state}
              </p>
              <h2 className="mt-1 text-lg font-bold text-white">Suggest a change</h2>
              <p className="mt-1 text-sm text-neutral-400">Pick someone by where they were born, not where they lived or worked.</p>
            </div>
            {[
              { name: 'person', label: 'Person name', type: 'text', required: true, placeholder: 'Full name' },
              { name: 'birthplace', label: 'Birthplace (village / town)', type: 'text', required: true, placeholder: 'e.g. village, mandal/tehsil' },
              { name: 'sourceUrl', label: 'Source URL', type: 'url', required: false, placeholder: 'https://' },
            ].map((f) => (
              <label key={f.name} className="flex flex-col gap-1.5 text-sm text-neutral-300">
                {f.label}
                <input
                  name={f.name}
                  type={f.type}
                  required={f.required}
                  placeholder={f.placeholder}
                  className="rounded-xl border border-white/10 bg-black px-3 py-2.5 text-[15px] text-white outline-none placeholder:text-neutral-600 focus:border-white/40"
                />
              </label>
            ))}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-sm text-neutral-400 hover:text-white">
                Cancel
              </button>
              <button type="submit" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-neutral-200">
                Save suggestion
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-white">{done ? 'Thanks — saved.' : 'Could not save'}</h2>
            <p className="text-sm text-neutral-400">
              {done
                ? `Your suggestion is stored in this browser (${readSuggestions().length} saved so far). Nothing is sent anywhere.`
                : 'This browser is blocking local storage (private mode?), so the suggestion was not kept.'}
            </p>
            <div className="flex justify-end">
              <button onClick={onClose} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black">
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
