import { Card } from '../components/UI.jsx'

const TEAM = ['P K Prethksha', 'Pinapatruni Srihita', 'Pranav Thorat', 'Manish Kushwaha']

export default function About() {
  return (
    <>
      <h1>About AquaHeal AI</h1>
      <div className="mu small">Autonomous Self-Healing Smart Water Distribution Network using AI, IoT &amp; Digital Twin</div>
      <div className="grid grid2">
        <Card title="Problem statement"><p className="mu">Aging distribution networks lose 30–50% of treated water, and faults surface only after complaints or visible damage. Operators lack real-time visibility into pipe condition.</p></Card>
        <Card title="Objectives"><ul className="mu"><li>Real-time sensing of flow, pressure, acoustics and quality</li><li>AI fault classification: leaks, bursts, blockages, contamination</li><li>Digital twin localization and pre-action validation</li><li>Simulation-checked valve action with operator override</li><li>Live dashboard, alerts and audit trail</li><li>Condition-based maintenance planning</li></ul></Card>
        <Card title="Methodology"><p className="mu">Sense → Detect → Simulate → Act → Notify, adopted in phases: monitoring only, then supervised corrective action, then autonomy for low-risk, high-confidence cases.</p></Card>
        <Card title="Technology architecture"><p className="mu">Simulator engine → detector interface → digital twin → approval-gated valve layer → FastAPI REST + WebSocket → React dashboard. Detector and twin are replaceable modules.</p></Card>
      </div>
      <Card title="Team · Group SY320">
        <div className="grid">{TEAM.map((t) => <div key={t}><b>{t}</b></div>)}</div>
        <p className="mu">Mentor: Prof. Karan Mashal<br />Department of Computer Science &amp; Engineering, MIT School of Computing, MIT-ADT University</p>
      </Card>
    </>
  )
}
