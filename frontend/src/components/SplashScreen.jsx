import { useState, useEffect, useRef } from 'react';

const STATUSES = [
  { text: 'Initializing...', duration: 800 },
  { text: 'Connecting to server...', duration: 2000 },
  { text: 'Waking up the server...', duration: 3000 },
  { text: 'Almost there...', duration: 2000 },
  { text: 'Ready!', duration: 500 },
];

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SplashScreen = ({ onComplete }) => {
  const [statusIndex, setStatusIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const [dots, setDots] = useState('');
  const startedRef = useRef(false);

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  // Advance through statuses
  useEffect(() => {
    if (statusIndex >= STATUSES.length - 1) return;
    const timer = setTimeout(() => {
      setStatusIndex(prev => prev + 1);
    }, STATUSES[statusIndex].duration);
    return () => clearTimeout(timer);
  }, [statusIndex]);

  // Animate progress bar
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + Math.random() * 8;
        return next >= 92 ? 92 : next;
      });
    }, 600);
    return () => clearInterval(interval);
  }, []);

  // Ping backend until it responds
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;
    let retries = 0;

    const ping = async () => {
      while (!cancelled) {
        try {
          const res = await fetch(`${API_BASE_URL.replace('/api', '')}/health`, {
            signal: AbortSignal.timeout(8000),
          });
          if (res.ok && !cancelled) {
            setProgress(100);
            setStatusIndex(STATUSES.length - 1);
            await new Promise(r => setTimeout(r, 600));
            if (!cancelled) {
              setFadeOut(true);
              setTimeout(onComplete, 500);
            }
            return;
          }
        } catch {
          retries++;
        }
        if (!cancelled) {
          await new Promise(r => setTimeout(r, 1500));
        }
      }
    };

    ping();

    return () => { cancelled = true; };
  }, [onComplete]);

  const status = STATUSES[statusIndex] || STATUSES[STATUSES.length - 1];

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        background: 'radial-gradient(ellipse at 50% 40%, rgba(139,92,246,0.12), transparent 70%), radial-gradient(ellipse at 80% 60%, rgba(245,158,11,0.08), transparent 50%), #0B0F1A',
      }}
    >
      <div className="text-center px-6">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-amber-500/20 animate-pulse">
              <span className="text-4xl font-bold text-white">&lt;/&gt;</span>
            </div>
            <div className="absolute -inset-2 rounded-2xl bg-gradient-to-br from-amber-500/20 to-purple-600/20 blur-xl -z-10" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
          CodeVerse
        </h1>
        <p className="text-gray-400 mb-10 text-lg">
          Unified Competitive Programming Hub
        </p>

        {/* Status */}
        <p className="text-amber-400 font-medium mb-4 h-6 transition-all duration-300">
          {status.text}{statusIndex < STATUSES.length - 1 ? dots : ''}
        </p>

        {/* Progress bar */}
        <div className="w-64 mx-auto h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
