import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider, SettingsProvider, FeedProvider } from './context'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <SettingsProvider>
        <FeedProvider>
          <App />
        </FeedProvider>
      </SettingsProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
