import { Ready } from '../LiveContext.jsx'
import { Badge, Card, Empty, Note, fmtTime } from '../components/UI.jsx'

export default function Anomalies() {
  return <Ready>{(s) => {
    const inc = s.alerts.filter((a) => a.kind === 'incident')
    return (
      <>
        <h1>AI anomaly detection</h1>
        <Note>Detection uses a threshold-rule baseline on simulated readings. Trained models plug in through the <code>BaseDetector</code> interface in <code>backend/app/detector.py</code>.</Note>
        <Card className="tw">
          <table>
            <thead><tr><th>Time</th><th>Class</th><th>Pipeline</th><th>Severity</th><th>Confidence</th><th>Pressure</th><th>Flow</th><th>Acoustic</th><th>Turbidity</th><th>Status</th></tr></thead>
            <tbody>{inc.map((a) => (
              <tr key={a.id}><td>{fmtTime(a.time)}</td><td>{a.title}</td><td>{a.pipe_id}</td><td><Badge>{a.severity}</Badge></td><td>{Math.round(a.confidence * 100)}%</td>
                <td>{a.readings.pressure} bar</td><td>{a.readings.flow} L/s</td><td>{a.readings.acoustic} dB</td><td>{a.readings.turbidity} NTU</td><td><Badge>{a.status}</Badge></td></tr>
            ))}</tbody>
          </table>
          {!inc.length && <Empty>No anomalies detected yet.</Empty>}
        </Card>
      </>
    )
  }}</Ready>
}
