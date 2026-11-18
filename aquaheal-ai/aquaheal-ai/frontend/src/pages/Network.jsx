import { useState } from 'react'
import { api } from '../api'
import { Ready, useAction } from '../LiveContext.jsx'
import NetworkMap, { Legend } from '../components/NetworkMap.jsx'
import { Badge, Card, useConfirm } from '../components/UI.jsx'

const FAULTS = [['leak', 'Leakage'], ['burst', 'Pipeline burst'], ['blockage', 'Blockage'], ['contamination', 'Contamination'], ['pressure', 'Pressure variation']]

export default function Network() {
  const [sel, setSel] = useState('P6'), [ft, setFt] = useState('leak')
  const run = useAction(), confirm = useConfirm()
  return <Ready>{(s) => {
    const p = s.pipes.find((x) => x.id === sel)
    return (
      <>
        <h1>Live network</h1><div className="mu small">Select a pipeline to inspect it. Demo faults let you exercise the full loop.</div>
        <div className="row">
          <select value={sel} onChange={(e) => setSel(e.target.value)} aria-label="Pipeline">{s.pipes.map((x) => <option key={x.id}>{x.id}</option>)}</select>
          <select value={ft} onChange={(e) => setFt(e.target.value)} aria-label="Fault type">{FAULTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          <button className="danger" onClick={() => run(() => api('/api/faults', { method: 'POST', body: { pipe_id: sel, type: ft } }), `Simulated ${ft} injected on ${sel}`)}>Inject demo fault</button>
        </div>
        <div className="grid grid2">
          <Card><NetworkMap nodes={s.nodes} pipes={s.pipes} selected={sel} onSelect={setSel} /><Legend /></Card>
          <Card>
            <h2>{p.id} · {p.a} → {p.b} <Badge>{p.status}</Badge></h2>
            <table><tbody>
              <tr><th>Pressure</th><td>{p.pressure.toFixed(2)} bar (baseline {p.base_pressure})</td></tr>
              <tr><th>Flow</th><td>{p.flow.toFixed(1)} L/s (baseline {p.base_flow})</td></tr>
              <tr><th>Acoustic</th><td>{p.acoustic.toFixed(0)} dB</td></tr>
              <tr><th>Turbidity / chlorine</th><td>{p.turbidity.toFixed(2)} NTU / {p.chlorine.toFixed(2)} mg/L</td></tr>
              <tr><th>Material / age</th><td>{p.material} / {p.age} y</td></tr>
              <tr><th>Valve V{p.id.slice(1)}</th><td>{p.valve}</td></tr>
            </tbody></table>
            {p.fault && p.valve === 'closed' && (
              <div className="row"><button onClick={async () => {
                if (await confirm({ title: 'Mark repair complete?', body: `Reopens ${p.id} and clears its fault (simulated).`, label: 'Mark repaired' }))
                  run(() => api(`/api/pipes/${p.id}/repair`, { method: 'POST', body: { operator: 'Operator' } }), `${p.id} restored`)
              }}>Mark repair complete (simulated)</button></div>
            )}
          </Card>
        </div>
      </>
    )
  }}</Ready>
}
