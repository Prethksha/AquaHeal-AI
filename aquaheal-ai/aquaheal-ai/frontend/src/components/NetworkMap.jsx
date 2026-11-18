export const STATUS_COLOR = { normal: 'var(--ac)', warning: 'var(--wa)', leak: 'var(--er)', isolated: 'var(--gy)', resolved: 'var(--rs)' }

export function Legend() {
  return (
    <div className="row small mu">
      {Object.entries(STATUS_COLOR).map(([k, c]) => <span key={k}><b style={{ color: c }}>●</b> {k}</span>)}
      <span>◇ valve</span>
    </div>
  )
}

export default function NetworkMap({ nodes, pipes, selected, onSelect, animate }) {
  const N = Object.fromEntries(nodes.map((n) => [n.id, n]))
  return (
    <svg viewBox="0 0 600 390" width="100%" role="img" aria-label="Water distribution network diagram">
      {pipes.map((p) => {
        const a = N[p.a], b = N[p.b], c = STATUS_COLOR[p.status]
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2
        const sel = selected === p.id && !animate
        return (
          <g key={p.id} onClick={() => onSelect?.(p.id)} style={{ cursor: onSelect ? 'pointer' : 'default' }}
            tabIndex={onSelect ? 0 : -1} onKeyDown={(e) => e.key === 'Enter' && onSelect?.(p.id)} aria-label={`Pipeline ${p.id}, ${p.status}`}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={c} strokeWidth={sel ? 7 : 4} strokeLinecap="round" opacity={p.status === 'isolated' ? 0.6 : 1} />
            {animate && p.status !== 'isolated' && <line className="flow" x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--bg)" strokeWidth="1.5" opacity=".7" />}
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" strokeWidth="16" />
            <rect x={mx - 6} y={my - 6} width="12" height="12" transform={`rotate(45 ${mx} ${my})`} fill={p.valve === 'open' ? 'var(--card)' : 'var(--gy)'} stroke={c} strokeWidth="2" />
            <text x={mx + 10} y={my - 9}>{p.id}</text>
            {p.status === 'leak' && (
              <circle cx={a.x + (b.x - a.x) * 0.25} cy={a.y + (b.y - a.y) * 0.25} r="9" fill="none" stroke="var(--er)" strokeWidth="2">
                <animate attributeName="r" values="6;16;6" dur="1.6s" repeatCount="indefinite" />
              </circle>
            )}
          </g>
        )
      })}
      {nodes.map((n) => n.id === 'R'
        ? <g key="R"><rect x="38" y="172" width="44" height="36" rx="6" fill="var(--ac)" /><text x="30" y="226">Treatment plant</text></g>
        : <g key={n.id}><circle cx={n.x} cy={n.y} r="8" fill="var(--card)" stroke="var(--ac)" strokeWidth="2.5" /><text x={n.x - 8} y={n.y + 24}>{n.id}</text></g>)}
    </svg>
  )
}
