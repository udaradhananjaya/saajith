// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  root: 'renderer',       // where index.html lives
  base: './',             // important for Electron (relative paths)
  build: {
    outDir: '../dist',    // bundle output
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: 'renderer/index.html',
        queries: 'renderer/queries.html'
      }
    }
  }
})
