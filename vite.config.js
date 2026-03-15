import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base path must match the GitHub repo name
// Current repo: github.com/Phuzamanzegiza/pmb-checker
export default defineConfig({
  plugins: [react()],
  base: '/pmb-checker/',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.js',
  },
})
