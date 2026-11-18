import { createContext, useCallback, useContext, useRef, useState } from 'react'

const Ctx = createContext(null)
export const useToast = () => useContext(Ctx).toast
export const useConfirm = () => useContext(Ctx).confirm

export function UIProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [dlg, setDlg] = useState(null)
  const id = useRef(0)

  const toast = useCallback((message, kind = 'ok') => {
    const t = { id: ++id.current, message, kind }
    setToasts((l) => [...l, t])
    setTimeout(() => setToasts((l) => l.filter((x) => x.id !== t.id)), 4000)
  }, [])
  const confirm = useCallback((opts) => new Promise((resolve) => setDlg({ ...opts, resolve })), [])
  const close = (v) => { dlg.resolve(v); setDlg(null) }

  return (
    <Ctx.Provider value={{ toast, confirm }}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => <div key={t.id} className={'toast ' + t.kind}>{t.message}</div>)}
      </div>
      {dlg && (
        <div className="overlay" onClick={() => close(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-label={dlg.title} onClick={(e) => e.stopPropagation()}>
            <h3>{dlg.title}</h3>
            <p className="mu">{dlg.body}</p>
            <div className="row">
              <button className={dlg.danger ? 'danger' : ''} autoFocus onClick={() => close(true)}>{dlg.label || 'Confirm'}</button>
              <button className="ghost" onClick={() => close(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  )
}

export const Badge = ({ kind, children }) => <span className={'badge ' + (kind || children)}>{children}</span>
export const Card = ({ title, children, className = '' }) => (
  <section className={'card ' + className}>{title && <h2>{title}</h2>}{children}</section>
)
export const Kpi = ({ label, value, unit, tone }) => (
  <div className="card"><div className="mu small">{label}</div><div className={'kpi ' + (tone || '')}>{value} <span className="mu small">{unit}</span></div></div>
)
export const Note = ({ children }) => <div className="note">{children}</div>
export const Empty = ({ children }) => <div className="empty">{children}</div>
export const Skeleton = ({ rows = 3 }) => (
  <div aria-busy="true">{Array.from({ length: rows }, (_, i) => <div key={i} className="skel" />)}</div>
)
export const ErrorState = ({ message, onRetry }) => (
  <div className="card err"><h2>Cannot load data</h2><p>{message}</p>
    <p className="mu small">Start the backend with <code>uvicorn app.main:app --reload --port 8000</code> inside the backend folder.</p>
    {onRetry && <button onClick={onRetry}>Retry</button>}</div>
)
export const fmtTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
