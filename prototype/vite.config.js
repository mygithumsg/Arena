import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const noStore = { 'Cache-Control': 'no-store' }

export default defineConfig({
  plugins: [react()],
  server: { host: '0.0.0.0', port: 5173, allowedHosts: true, headers: noStore },
  preview: { host: '0.0.0.0', port: 5173, allowedHosts: true, headers: noStore }
})
