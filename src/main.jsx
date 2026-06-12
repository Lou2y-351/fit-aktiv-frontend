import { StrictMode } from 'react'
import '@tabler/icons-webfont/dist/tabler-icons.css'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
