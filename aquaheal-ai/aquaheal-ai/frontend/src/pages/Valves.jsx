import { api } from '../api'
import { Ready, useAction } from '../LiveContext.jsx'
import { Badge, Card, Note, fmtTime, useConfirm, useToast } from '../components/UI.jsx'

export default function Valves() {
  const run = useAction(), confirm = useConfirm(), toast = useToast()
  const operate = async (p, op) => {
    const label = { open: 'Open', close: 'Close', isolate: 'Isolate' }[op]
    if (await confirm({ title: `${label} valve V${p.id.slice(1)}?`, body: `${label} valve on ${p.id}. This is a SIMULATED action; no physical valve is controlled.`, label, danger: op !== 'open' }))
      run(() => api(`/api/valves/${p.id}/operate`, { method: 'POST', body: { op, confirm: true, operator: 'Operator' } }), `Simulated: valve V${p.id.slice(1)} ${op}`)
  }
  const preview = async (p) => { try { toast((await api(`/api/valves/${p.id}/preview`, { method: 'POST' })).message) } catch (e) { toast(e.message, 'error') } }
  return <Ready>{(s) => (
    <>
      <h1>Smart valve control</h1>
      <Note>All operations are simulated. No physical valve is controlled, and every action requires operator confirmation and backend validation.</Note>
      <Card className="tw">
        <table>
          <thead><tr><th>Valve</th><th>Location</th><th>Pipeline</th><th>State</th><th>Last operation</th><th>Health</th><th>Controls</th></tr></thead>
          <tbody>{s.pipes.map((p) => {
            const last = s.log.find((l) => l.type === 'valve' && l.message.startsWith(`Valve V${p.id.slice(1)} `))
            return (
              <tr key={p.id}><td>V{p.id.slice(1)}</td><td>{p.a}–{p.b}</td><td>{p.id}</td><td><Badge>{p.valve}</Badge></td><td>{last ? fmtTime(last.time) : '–'}</td><td><Badge kind="normal">OK</Badge></td>
                <td><div className="row" style={{ margin: 0 }}>
                  <button className="ghost" onClick={() => operate(p, p.valve === 'open' ? 'close' : 'open')}>{p.valve === 'open' ? 'Close' : 'Open'}</button>
                  <button className="ghost" onClick={() => operate(p, 'isolate')}>Isolate</button>
                  <button className="ghost" onClick={() => preview(p)}>Simulate</button></div></td></tr>
            )
          })}</tbody>
        </table>
      </Card>
    </>
  )}</Ready>
}
