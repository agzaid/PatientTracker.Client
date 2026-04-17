
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n/config'

// Remove dark mode class addition
createRoot(document.getElementById("root")!).render(<App />);
