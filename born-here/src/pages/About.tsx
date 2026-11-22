export function About() {
  const items: [string, string][] = [
    ['Placed by birthplace', 'Each person sits in the district where they were born — not where they lived, worked, were elected or died.'],
    ['Present-day districts', 'Old birthplaces are mapped onto today’s district boundaries, so someone born in a village that is now part of a newer district is shown in the new one.'],
    ['“?” means no clear pick', 'A grey question mark marks an open slot: either nobody famous enough has a well-documented birthplace there, or the choice is still open. Suggestions welcome.'],
    ['Confidence', 'Verified — the birthplace is well documented. Disputed — sources disagree; the panel explains why. Legendary — the birthplace comes from tradition or legend rather than records. Open slot — no pick yet.'],
    ['Boundaries are approximate', 'District shapes come from the open india-maps-data project and are simplified for speed. They are for illustration only and are not an authoritative depiction of any border.'],
    ['Suggestions stay with you', 'The “Suggest a change” form saves to your browser’s local storage. There is no login and no server.'],
  ]
  return (
    <main className="mx-auto max-w-2xl px-4 pb-20 pt-12 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">About &amp; method</h1>
      <p className="mt-3 text-neutral-400">
        Born Here is a set of infographic-style maps: one name for every district of a state — the most famous person born there.
      </p>
      <dl className="mt-10 flex flex-col gap-7">
        {items.map(([t, d], i) => (
          <div key={t} className="flex gap-4">
            <span
              className="mt-1 size-3 shrink-0 rounded-sm"
              style={{ background: ['#f6c9cc', '#cfe8b4', '#f6eb9c', '#dcc8f2'][i % 4] }}
              aria-hidden
            />
            <div>
              <dt className="font-semibold text-white">{t}</dt>
              <dd className="mt-1 text-[15px] leading-relaxed text-neutral-400">{d}</dd>
            </div>
          </div>
        ))}
      </dl>
      <p className="mt-12 text-sm text-neutral-500">
        Map data:{' '}
        <a className="underline hover:text-neutral-300" href="https://github.com/udit-001/india-maps-data" target="_blank" rel="noreferrer">
          udit-001/india-maps-data
        </a>
        .
      </p>
    </main>
  )
}
