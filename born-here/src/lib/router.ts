import { useEffect, useState } from 'react'

export type Route = { page: 'home' } | { page: 'about' } | { page: 'state'; slug: string }

// Plain one-word hashes (#about, #telangana) so links survive any static host.
function parse(hash: string): Route {
  const h = decodeURIComponent(hash.replace(/^#\/?/, '')).replace(/^state\//, '')
  if (!h) return { page: 'home' }
  if (h === 'about') return { page: 'about' }
  return { page: 'state', slug: h }
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parse(window.location.hash))
  useEffect(() => {
    const on = () => {
      setRoute(parse(window.location.hash))
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}

export const href = {
  home: '#',
  about: '#about',
  state: (slug: string) => `#${slug}`,
}
