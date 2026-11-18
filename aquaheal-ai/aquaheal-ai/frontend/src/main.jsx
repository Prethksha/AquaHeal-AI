import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { UIProvider } from './components/UI.jsx'
import { LiveProvider } from './LiveContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <UIProvider>
          <LiveProvider>
            <App />
          </LiveProvider>
        </UIProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)