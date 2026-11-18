import { useEffect, useState } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useLive } from './LiveContext.jsx'
import Landing from './pages/Landing.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Network from './pages/Network.jsx'
import Anomalies from './pages/Anomalies.jsx'
import Twin from './pages/Twin.jsx'
import Valves from './pages/Valves.jsx'
import Maintenance from './pages/Maintenance.jsx'
import Alerts from './pages/Alerts.jsx'
import Reports from './pages/Reports.jsx'
import About from './pages/About.jsx'

const NAV = [['dashboard', 'Dashboard'], ['network', 'Live network'], ['anomalies', 'Anomaly detection'], ['twin', 'Digital twin'],
  ['valves', 'Valves'], ['maintenance', 'Maintenance'], ['alerts', 'Alerts'], ['reports', 'Reports'], ['about', 'About']]
const STATUS = { live: ['Live (WebSocket)', 'normal'], polling: ['Polling', 'warning'], connecting: ['Connecting…', 'warning'], offline: ['Backend offline', 'leak'] }

export default function App() {
  const { pathname } = useLocation()
  const { status, snap } = useLive()
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('theme', theme) }, [theme])
  const home = pathname === '/'
  const [label, kind] = STATUS[status]
  const open = snap ? snap.alerts.filter((a) => a.kind === 'incident' && a.status !== 'resolved').length : 0

  return (
    <div className={home ? 'app home' : 'app'}>
      <header>
        <NavLink to="/" className="brand">Aqua<i>Heal</i> AI</NavLink>
        <span className="badge warning" title="All telemetry comes from the built-in simulator">Simulated telemetry · no hardware connected</span>
        <span className="grow" />
        <span className={'badge ' + kind}>{label}</span>
        <button className="ghost" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">{theme === 'dark' ? 'Light' : 'Dark'}</button>
        {home && <NavLink to="/dashboard"><button>Open dashboard</button></NavLink>}
      </header>
      <div className="shell">
        {!home && (
          <nav aria-label="Main">
            {NAV.map(([p, l]) => (
              <NavLink key={p} to={'/' + p} className={({ isActive }) => (isActive ? 'on' : '')}>
                {l}{p === 'alerts' && open > 0 && <span className="count">{open}</span>}
              </NavLink>
            ))}
          </nav>
        )}
        <main>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/network" element={<Network />} />
            <Route path="/anomalies" element={<Anomalies />} />
            <Route path="/twin" element={<Twin />} />
            <Route path="/valves" element={<Valves />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
