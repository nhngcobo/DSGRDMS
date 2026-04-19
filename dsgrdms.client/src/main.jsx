import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { NotificationProvider } from './context/NotificationContext.jsx'
import { RoleProvider } from './context/RoleContext.jsx'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <NotificationProvider>
        <RoleProvider>
          <App />
        </RoleProvider>
      </NotificationProvider>
    </BrowserRouter>
  </StrictMode>,
)
