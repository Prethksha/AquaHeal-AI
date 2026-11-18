import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div style={{ padding: 24, color: '#e6eef9', fontFamily: 'system-ui', maxWidth: 800 }}>
        <h2>Something went wrong</h2>
        <p>Please send a screenshot of this message. Then try refreshing with Ctrl + Shift + R.</p>
        <pre style={{ whiteSpace: 'pre-wrap', background: '#0c1a31', padding: 12, borderRadius: 8 }}>
          {String(this.state.error?.stack || this.state.error)}
        </pre>
      </div>
    )
  }
}