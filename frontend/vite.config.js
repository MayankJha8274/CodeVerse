import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['lucide-react', 'recharts', 'react-router-dom', 'socket.io-client', '@heroicons/react/24/solid', '@heroicons/react/24/outline']
  },
  server: {
    warmup: {
      clientFiles: [
        './src/pages/Dashboard.jsx',
        './src/pages/DailyChallengePage.jsx'
      ]
    }
  }
})
