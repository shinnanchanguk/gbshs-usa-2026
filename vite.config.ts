import { defineConfig, type Plugin, type UserConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 배포본에만 보안 정책(CSP)을 넣는다. 개발 서버는 HMR 인라인 스크립트가 있어 넣지 않는다.
// GitHub Pages 는 응답 헤더를 못 바꾸므로 meta 로 둔다. 지도 타일·글꼴은 OpenFreeMap 에서만 받는다. 서버 자료는 ZUDO 에서만 받는다.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://tiles.openfreemap.org",
  "font-src 'self' data:",
  // ZUDO: 로그인 연동(/api/trip/session·me), 내 항공권, 기상 확인(src/lib/zudo.ts)
  "connect-src 'self' https://tiles.openfreemap.org https://zudo.my",
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ')

function securityMeta(): Plugin {
  return {
    name: 'security-meta',
    apply: 'build',
    transformIndexHtml: (html) =>
      html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />\n    <meta name="referrer" content="no-referrer" />`),
  }
}

// GitHub Pages 주소가 https://shinnanchanguk.github.io/gbshs-usa-2026/ 이므로 base 를 레포 이름으로 맞춘다.
export const SITE_BASE = '/gbshs-usa-2026/'

/** 본 사이트(입장 코드)와 학생 사전 안내판(vite.guide.config.ts)이 함께 쓰는 설정 */
export function baseConfig(guide: boolean): UserConfig {
  return {
  base: SITE_BASE,
  define: { __GUIDE__: JSON.stringify(guide), __SITE_BASE__: JSON.stringify(SITE_BASE) },
  plugins: [react(), securityMeta()],
  // 지도 워커(maplibre-gl-worker.mjs)가 ES 모듈이라 워커 번들도 ES 모듈로 만든다.
  worker: { format: 'es' },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      // 지도 엔진은 따로 묶는다. 안내 내용만 고쳐 다시 배포해도 휴대폰이 지도 엔진을 다시 받지 않는다.
      output: { manualChunks: (id) => (id.includes('node_modules/maplibre-gl') || id.includes('node_modules/@maplibre') ? 'maplibre' : id.includes('node_modules/react') ? 'react' : undefined) },
    },
  },
  }
}

export default defineConfig(baseConfig(false))
