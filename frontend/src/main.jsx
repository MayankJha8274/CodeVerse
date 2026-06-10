import { useState, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import SplashScreen from './components/SplashScreen'

const initTheme = () => {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  const root = document.documentElement;
  if (savedTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

initTheme();

function Root() {
  const [ready, setReady] = useState(false);

  if (!ready) {
    return <SplashScreen onComplete={() => setReady(true)} />;
  }

  return (
    <StrictMode>
      <App />
    </StrictMode>
  );
}

createRoot(document.getElementById('root')).render(<Root />)
