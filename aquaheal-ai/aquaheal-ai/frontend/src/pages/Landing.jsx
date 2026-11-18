import { Link } from 'react-router-dom'
import { useLive } from '../LiveContext.jsx'
import NetworkMap, { Legend } from '../components/NetworkMap.jsx'
import { Card } from '../components/UI.jsx'

const STEPS = [['Sense', 'IoT sensors stream flow, pressure, acoustic and water-quality data.'], ['Detect', 'Models flag and classify leaks, bursts, blockages and contamination.'],
  ['Simulate', 'The digital twin localizes the fault and previews corrective actions.'], ['Act', 'Validated fixes run through smart valves with operator approval.'], ['Notify', 'Alerts, dashboard and an audit trail record every step.']]
const FEATURES = ['Live network view with five pipeline states', 'Anomaly classification with confidence', 'Digital twin what-if simulation', 'Approval-gated simulated valve control', 'Predictive maintenance risk ranking', 'Alerts, reports and audit logs']
const USES = ['Municipal and city-wide networks', 'Campus and industrial parks', 'Rural supply schemes', 'Smart-city infrastructure', 'Legacy SCADA modernization', 'Water-scarce regions']

export default function Landing() {
  const { snap } = useLive()
  return (
    <>
      <div className="hero">
        <h1>Intelligent Water Networks. Autonomous Healing.</h1>
        <p className="mu">Monitor, detect, simulate, and resolve water distribution failures with AI-powered intelligence and digital twin technology.</p>
        <div className="row"><Link to="/dashboard"><button>Explore Dashboard</button></Link><Link to="/about"><button className="ghost">Discover Technology</button></Link></div>
      </div>
      <Card>
        {snap ? <NetworkMap nodes={snap.nodes} pipes={snap.pipes} animate /> : <div className="empty">Start the backend to see the live network.</div>}
        <Legend /><div className="mu small">Demonstration network driven by the built-in simulator.</div>
      </Card>
      <h2 style={{ marginTop: 28 }}>Project overview</h2>
      <p className="mu" style={{ maxWidth: 720 }}>Utilities lose an estimated 30–50% of treated water to undetected leaks and faults. Most networks still rely on patrols and complaints. AquaHeal AI replaces that with a closed loop that keeps operators in charge.</p>
      <h2>Sense → Detect → Simulate → Act → Notify</h2>
      <div className="grid">{STEPS.map(([t, d]) => <Card key={t}><b>{t}</b><p className="mu small">{d}</p></Card>)}</div>
      <h2>Key features</h2>
      <div className="grid">{FEATURES.map((f) => <Card key={f}>{f}</Card>)}</div>
      <div className="grid grid2">
        <Card title="Technology stack"><p className="mu">React + Vite frontend, FastAPI backend with WebSocket streaming, Python simulation engine, pluggable detector interface for Random Forest / Isolation Forest / LSTM models, and a twin layer ready for EPANET/WNTR.</p></Card>
        <Card title="Applications">{USES.map((u) => <div key={u} className="mu">• {u}</div>)}</Card>
      </div>
      <footer className="mu small" style={{ padding: '24px 0' }}>AquaHeal AI · Group SY320 · Department of Computer Science &amp; Engineering, MIT School of Computing, MIT-ADT University · Mentor: Prof. Karan Mashal</footer>
    </>
  )
}
