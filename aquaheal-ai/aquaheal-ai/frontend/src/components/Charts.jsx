import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export function Trend({ title, data, color, unit }) {
  const rows = data.map((v, i) => ({ i, v }))
  const last = data.length ? data[data.length - 1] : null
  return (
    <section className="card">
      <div className="mu small">{title}</div>
      <div className="kpi">{last == null ? '–' : last.toFixed(1)} <span className="mu small">{unit}</span></div>
      <div style={{ height: 120 }}>
        <ResponsiveContainer>
          <LineChart data={rows} margin={{ top: 6, right: 4, left: -22, bottom: 0 }}>
            <XAxis dataKey="i" hide />
            <YAxis tick={{ fontSize: 10, fill: 'var(--mu)' }} domain={['auto', 'auto']} />
            <Tooltip formatter={(v) => [Number(v).toFixed(2) + ' ' + unit, title]} labelFormatter={() => ''}
              contentStyle={{ background: 'var(--card)', border: '1px solid var(--bd)', borderRadius: 8 }} />
            <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

export const Bar = ({ pct, color }) => (
  <div className="bar"><i style={{ width: Math.max(0, Math.min(100, pct)) + '%', background: color }} /></div>
)
