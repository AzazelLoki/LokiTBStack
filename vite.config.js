import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vercel va utiliser cette config automatiquement
export default defineConfig({
  plugins: [react()],
})
