import { Header } from './components/Header'
import { useRoute } from './lib/router'
import { About } from './pages/About'
import { Home } from './pages/Home'
import { StatePage } from './pages/StatePage'

export default function App() {
  const route = useRoute()
  return (
    <div className="min-h-screen bg-ink">
      <Header route={route} />
      {route.page === 'home' && <Home />}
      {route.page === 'about' && <About />}
      {route.page === 'state' && <StatePage key={route.slug} slug={route.slug} />}
    </div>
  )
}
