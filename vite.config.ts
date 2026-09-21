import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages 주소가 https://shinnanchanguk.github.io/gbshs-usa-2026/ 이므로 base 를 레포 이름으로 맞춘다.
export default defineConfig({
  base: '/gbshs-usa-2026/',
  plugins: [react()],
  // 지도 워커(maplibre-gl-worker.mjs)가 ES 모듈이라 워커 번들도 ES 모듈로 만든다.
  worker: { format: 'es' },
  build: {
    chunkSizeWarningLimit: 1500,
  },
})
