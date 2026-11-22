import { href, type Route } from '../lib/router'

export function Header({ route }: { route: Route }) {
  const link = (to: string, label: string, on: boolean) => (
    <a href={to} className={`rounded-full px-3 py-1.5 text-sm transition ${on ? 'bg-white/10 text-white' : 'text-neutral-400 hover:text-white'}`}>
      {label}
    </a>
  )
  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between px-4 pt-4 sm:px-6">
      <a href={href.home} className="flex items-center gap-2.5">
        <span className="grid size-7 grid-cols-2 gap-[2px] overflow-hidden rounded-md" aria-hidden>
          <span className="bg-pink" />
          <span className="bg-green" />
          <span className="bg-yellow" />
          <span className="bg-lavender" />
        </span>
        <span className="text-[15px] font-extrabold tracking-tight text-white">Born Here</span>
      </a>
      <nav className="flex items-center gap-1">
        {link(href.home, 'Map', route.page !== 'about')}
        {link(href.about, 'About', route.page === 'about')}
      </nav>
    </header>
  )
}
