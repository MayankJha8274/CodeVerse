import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Initialize theme on app load
const initTheme = () => {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  const root = document.documentElement;
  
  console.log('Init theme:', savedTheme);
  console.log('HTML classes before init:', root.className);
  
  if (savedTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  
  console.log('HTML classes after init:', root.className);
};

initTheme();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
