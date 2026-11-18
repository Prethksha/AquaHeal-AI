import { Ready } from '../LiveContext.jsx'
import { Bar, Trend } from '../components/Charts.jsx'
import { STATUS_COLOR } from '../components/NetworkMap.jsx'
import { Badge, Card, Empty, Kpi, fmtTime } from '../components/UI.jsx'

const LOG_KIND = { detect: 'critical', valve: 'isolated', action: 'warning', maintenance: 'resolved', simulate: 'info' }

export default function Dashboard() {
  return <Ready>{(s) => {
    const k = s.kpis, inc = s.alerts.filter((a) => a.kind === 'incident')
    const byClass = inc.reduce((m, a) => ({ ...m, [a.title]: (m[a.title] || 0) + 1 }), {})
    const byStatus = s.pipes.reduce((m, p) => ({ ...m, [p.status]: (m[p.status] || 0) + 1 }), {})
    return (
      <>
        <h1>Network overview</h1><div className="mu small">Simulated telemetry, refreshed every 2 s.</div>
        <div className="grid">
          <Kpi label="Total pipeline length" value={k.total_length_km} unit="km" />
          <Kpi label="Active IoT sensors" value={k.sensors_online} unit={`/ ${k.sensors_total}`} />
          <Kpi label="Network health" value={k.health_pct} unit="%" tone={k.health_pct < 80 ? 'bad' : 'good'} />
          <Kpi label="Active incidents" value={k.active_incidents} tone={k.active_incidents ? 'bad' : ''} />
          <Kpi label="Estimated water loss" value={Math.round(k.loss_lpm)} unit="L/min" />
          <Kpi label="Resolved incidents" value={k.resolved_incidents} tone="good" />
        </div>
        <div className="grid">
          <Trend title="Water flow (plant outlet)" data={s.history.flow} color="var(--ac)" unit="L/s" />
          <Trend title="Average pressure" data={s.history.pressure} color="var(--rs)" unit="bar" />
          <Trend title="Water loss trend" data={s.history.loss_lpm} color="var(--er)" unit="L/min" />
        </div>
        <div className="grid grid2">
          <Card title="Pipeline status distribution">
            {Object.keys(STATUS_COLOR).map((st) => (
              <div className="row" key={st}><span style={{ width: 80 }}>{st}</span><Bar pct={((byStatus[st] || 0) / s.pipes.length) * 100} color={STATUS_COLOR[st]} /><b>{byStatus[st] || 0}</b></div>
            ))}
            <div className="mu small">Avg turbidity {k.avg_turbidity} NTU · Avg chlorine {k.avg_chlorine} mg/L · Session loss {k.cumulative_loss_m3} m³</div>
          </Card>
          <Card title="Historical anomalies by class">
            {inc.length ? Object.entries(byClass).map(([c, n]) => (
              <div className="row" key={c}><span style={{ width: 190 }}>{c}</span><Bar pct={(n / inc.length) * 100} color="var(--wa)" /><b>{n}</b></div>
            )) : <Empty>No anomalies yet. Inject a demo fault on the Live network page.</Empty>}
          </Card>
        </div>
        <Card title="Live activity">
          {s.log.slice(0, 10).map((l, i) => (
            <div className="row" key={i} style={{ margin: '4px 0' }}><span className="mu small">{fmtTime(l.time)}</span><Badge kind={LOG_KIND[l.type] || 'info'}>{l.type}</Badge><span>{l.message}</span></div>
          ))}
        </Card>
      </>
    )
  }}</Ready>
}
