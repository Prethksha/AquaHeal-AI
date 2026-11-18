import { useState } from 'react'
import { api } from '../api'
import { Ready, useAction } from '../LiveContext.jsx'
import { Card, Empty, Note, useConfirm } from '../components/UI.jsx'

const ACTIONS = [['isolate', 'Isolate pipeline (close valve)'], ['reduce_pressure', 'Reduce pressure']]
const Row = ({ n, a, b, u, d = 2 }) => <tr><th>{n}</th><td>{a.toFixed(d)} {u}</td><td>{b.toFixed(d)} {u}</td></tr>

export default function Twin() {
  const [iid, setIid] = useState(''), [action, setAction] = useState('isolate'), [res, setRes] = useState(null), [by, setBy] = useState('Operator'), [override, setOverride] = useState(false)
  const run = useAction(), confirm = useConfirm()
  return <Ready>{(s) => {
    const open = s.alerts.filter((a) => a.kind === 'incident' && a.status !== 'resolved')
    const id = open.find((a) => String(a.id) === iid)?.id ?? open[0]?.id
    const simulate = async () => { const r = await run(() => api('/api/twin/simulate', { method: 'POST', body: { incident_id: id, action } })); if (r && r !== true) setRes(r) }
    const apply = async () => {
      if (!(await confirm({ title: 'Approve corrective action?', body: `Apply “${res.action}” on ${res.pipe_id}. This is a SIMULATED action; no physical valve is controlled. Approval is recorded under “${by}”.`, label: 'Approve and apply' }))) return
      if (await run(() => api('/api/twin/apply', { method: 'POST', body: { incident_id: res.incident_id, action: res.action, approved_by: by, supervisor_override: override } }), 'Action applied (simulated)')) setRes(null)
    }
    return (
      <>
        <h1>Digital twin simulation</h1>
        <Note>Proof-of-concept graph model: it checks supply connectivity and estimates recovery. It is not a validated hydraulic model (EPANET/WNTR integration is planned).</Note>
        <Card>
          {open.length ? (
            <div className="row">
              <select value={id} onChange={(e) => { setIid(e.target.value); setRes(null) }} aria-label="Incident">{open.map((a) => <option key={a.id} value={a.id}>#{a.id} {a.title} on {a.pipe_id}</option>)}</select>
              <select value={action} onChange={(e) => { setAction(e.target.value); setRes(null) }} aria-label="Action">{ACTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
              <button onClick={simulate}>Simulate action</button>
            </div>
          ) : <Empty>No open incidents to simulate. Inject a demo fault on the Live network page.</Empty>}
        </Card>
        {res && (
          <Card title="Predicted outcome" className="tw">
            <table><thead><tr><th></th><th>Before</th><th>After</th></tr></thead><tbody>
              <Row n="Water loss" a={res.before.loss_lps} b={res.after.loss_lps} u="L/s" />
              <Row n="Fault-pipe pressure" a={res.before.pipe_pressure} b={res.after.pipe_pressure} u="bar" />
              <Row n="Network avg pressure" a={res.before.avg_pressure} b={res.after.avg_pressure} u="bar" />
              <tr><th>Nodes losing supply</th><td>0</td><td>{res.after.unserved}{res.unserved_nodes.length ? ` (${res.unserved_nodes.join(', ')})` : ''}</td></tr>
            </tbody></table>
            <Note>Safety check: {res.safety_ok ? 'passes (confidence ≥ 75% and no supply loss). Operator approval is still required.' : 'needs supervisor review. ' + res.safety_notes.join(' ')}</Note>
            <div className="mu small">{res.disclaimer}</div>
            <div className="row">
              <input value={by} onChange={(e) => setBy(e.target.value)} aria-label="Approving operator" placeholder="Operator name" />
              {!res.safety_ok && <label className="small"><input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)} /> Supervisor override</label>}
              <button onClick={apply} disabled={!by.trim() || (!res.safety_ok && !override)}>Approve and apply (simulated)</button>
            </div>
          </Card>
        )}
      </>
    )
  }}</Ready>
}
