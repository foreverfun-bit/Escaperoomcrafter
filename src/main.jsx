import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { RoomsProvider } from './store/RoomsContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <RoomsProvider>
        <App />
      </RoomsProvider>
    </HashRouter>
  </StrictMode>,
)
