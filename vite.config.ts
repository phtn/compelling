import tailwindcss from '@tailwindcss/vite'
import { beastOctane } from 'beast-tsrx/vite'
import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [tailwindcss(), beastOctane()],
  appType: 'spa',
  resolve: {
    alias: {
      '@': path.resolve('./src')
    }
  }
})
