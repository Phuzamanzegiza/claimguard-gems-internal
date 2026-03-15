import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base path must match the GitHub repo name
// Current repo: github.com/Phuzamanzegiza/claimguard-gems-internal
export default defineConfig({
  plugins: [react()],
  base: '/claimguard-gems-internal/',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.js',
  },
})
