import { useEffect, useState } from 'react'
import { api } from '../api'
import { useLive } from '../LiveContext.jsx'
import { Bar } from '../components/Charts.jsx'
import { Badge, Card, ErrorState, Note, Skeleton } from '../components/UI.jsx'

const COLOR = { High: 'var(--er)', Medium: 'var(--wa)', Low: 'var(--ok)' }

export default function Maintenance() {
  const { snap } = useLive(), [rows, setRows] = useState(null), [err, setErr] = useState(null)
  const active = snap?.kpis.active_incidents
  useEffect(() => { api('/api/maintenance').then(setRows).catch((e) => setErr(e.message)) }, [active])
  if (err) return <ErrorState message={err} />
  if (!rows) return <Skeleton rows={4} />
  return (
    <>
      <h1>Predictive maintenance</h1>
      <Note>Risk is a heuristic score from age, material factor, failure history and active faults. Survival-analysis models from the project plan are not implemented yet.</Note>
      <Card className="tw">
        <table>
          <thead><tr><th>Pipe</th><th>Material</th><th>Age</th><th>Past failures</th><th>Predicted risk</th><th>Priority</th><th>Inspect within</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.pipe_id}><td>{r.pipe_id}</td><td>{r.material}</td><td>{r.age} y</td><td>{r.past_failures}</td>
              <td><div className="row" style={{ margin: 0, minWidth: 170 }}><Bar pct={r.risk} color={COLOR[r.priority]} />{r.risk}</div></td><td><Badge>{r.priority}</Badge></td><td>{r.inspect_within}</td></tr>
          ))}</tbody>
        </table>
      </Card>
    </>
  )
}
