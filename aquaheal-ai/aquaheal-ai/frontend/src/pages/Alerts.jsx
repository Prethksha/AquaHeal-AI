import { useState } from 'react'
import { api } from '../api'
import { Ready, useAction } from '../LiveContext.jsx'
import { Badge, Card, Empty, fmtTime } from '../components/UI.jsx'

const FILTERS = ['all', 'critical', 'warning', 'info', 'resolved']

export default function Alerts() {
  const [f, setF] = useState('all'), [q, setQ] = useState(''), run = useAction()
  const post = (id, what, msg) => run(() => api(`/api/alerts/${id}/${what}`, { method: 'POST', body: { operator: 'Operator' } }), msg)
  return <Ready>{(s) => {
    const list = s.alerts.filter((a) => (f === 'all' || (f === 'resolved' ? a.status === 'resolved' : a.severity === f && a.status !== 'resolved'))
      && (!q || (a.title + a.pipe_id).toLowerCase().includes(q.toLowerCase())))
    return (
      <>
        <h1>Alerts and notifications</h1>
        <div className="row">
          {FILTERS.map((k) => <button key={k} className={f === k ? '' : 'ghost'} onClick={() => setF(k)}>{k}</button>)}
          <input placeholder="Search alerts or pipeline" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search alerts" />
        </div>
        <Card className="tw">
          <table>
            <thead><tr><th>Time</th><th>Severity</th><th>Alert</th><th>Pipeline</th><th>Recommended action</th><th>Status</th><th></th></tr></thead>
            <tbody>{list.map((a) => (
              <tr key={a.id}><td>{fmtTime(a.time)}</td><td><Badge>{a.severity}</Badge></td><td>{a.title}</td><td>{a.pipe_id}</td><td>{a.action_taken || a.recommendation}</td><td><Badge>{a.status}</Badge></td>
                <td><div className="row" style={{ margin: 0 }}>
                  {a.status === 'open' && <button className="ghost" onClick={() => post(a.id, 'ack', 'Alert acknowledged')}>Acknowledge</button>}
                  {a.status !== 'resolved' && <button className="ghost" onClick={() => post(a.id, 'resolve', 'Alert resolved')}>Resolve</button>}</div></td></tr>
            ))}</tbody>
          </table>
          {!list.length && <Empty>Nothing here. Alerts appear when anomalies are detected or valves change.</Empty>}
        </Card>
      </>
    )
  }}</Ready>
}
