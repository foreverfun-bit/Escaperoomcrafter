import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // GitHub Pages serves this as a project site under /Escaperoomcrafter/,
  // but local dev should still run at the server root.
  base: command === 'build' ? '/Escaperoomcrafter/' : '/',
  plugins: [react(), tailwindcss()],
}))
