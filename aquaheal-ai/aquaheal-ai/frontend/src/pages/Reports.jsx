import { useEffect, useState } from 'react'
import { api, csvUrl } from '../api'
import { useLive } from '../LiveContext.jsx'
import { Badge, Card, Empty, ErrorState, Kpi } from '../components/UI.jsx'

export default function Reports() {
  const { snap } = useLive()
  const [type, setType] = useState(''), [start, setStart] = useState(''), [end, setEnd] = useState('')
  const [rows, setRows] = useState(null), [err, setErr] = useState(null)
  const qs = new URLSearchParams(Object.entries({ type, start, end }).filter(([, v]) => v)).toString()
  const tick = Math.floor((snap?.tick || 0) / 5)
  useEffect(() => { api('/api/reports/log' + (qs ? '?' + qs : '')).then((r) => { setRows(r); setErr(null) }).catch((e) => setErr(e.message)) }, [qs, tick])
  const k = snap?.kpis, inc = snap?.alerts.filter((a) => a.kind === 'incident') || []
  return (
    <>
      <h1>Reports and audit log</h1>
      {k && <div className="grid">
        <Kpi label="Incidents (session)" value={inc.length} /><Kpi label="Resolved" value={k.resolved_incidents} />
        <Kpi label="Valve operations" value={snap.log.filter((l) => l.type === 'valve').length} /><Kpi label="Water lost" value={k.cumulative_loss_m3} unit="m³" />
      </div>}
      <div className="row">
        <input type="date" value={start} onChange={(e) => setStart(e.target.value)} aria-label="From date" />
        <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} aria-label="To date" />
        <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Event type">
          <option value="">All events</option>{['detect', 'simulate', 'valve', 'action', 'maintenance', 'system', 'sensor'].map((t) => <option key={t}>{t}</option>)}
        </select>
        <a href={csvUrl(qs)}><button className="ghost">Export CSV</button></a>
      </div>
      {err ? <ErrorState message={err} /> : (
        <Card className="tw">
          <table><thead><tr><th>Time</th><th>Type</th><th>Actor</th><th>Event</th></tr></thead>
            <tbody>{(rows || []).map((l, i) => <tr key={i}><td>{new Date(l.time).toLocaleString()}</td><td><Badge kind="info">{l.type}</Badge></td><td>{l.actor}</td><td style={{ whiteSpace: 'normal' }}>{l.message}</td></tr>)}</tbody></table>
          {rows && !rows.length && <Empty>No events match these filters.</Empty>}
        </Card>
      )}
    </>
  )
}
