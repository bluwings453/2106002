import { useEffect, useState } from 'react'

export type Route = { page: 'home' } | { page: 'about' } | { page: 'state'; slug: string }

function parse(hash: string): Route {
  const h = hash.replace(/^#\/?/, '')
  const parts = h.split('/').filter(Boolean)
  if (parts[0] === 'about') return { page: 'about' }
  if (parts[0] === 'state' && parts[1]) return { page: 'state', slug: decodeURIComponent(parts[1]) }
  return { page: 'home' }
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
  home: '#/',
  about: '#/about',
  state: (slug: string) => `#/state/${slug}`,
}
