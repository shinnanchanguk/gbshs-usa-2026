import { defineConfig, type Plugin } from 'vite'
import { baseConfig, SITE_BASE } from './vite.config'

/*
 * 학생 사전 안내판: https://shinnanchanguk.github.io/gbshs-usa-2026/guide/
 * 입장 코드 없이 열리고, 명단(자리·방·연락처)·느낀 점·선생님 기능이 빠진다(src/lib/edition.ts).
 * 본 사이트를 먼저 빌드한 뒤 dist/guide 에 따로 만든다. 사진은 본 사이트의 것을 함께 쓴다.
 * 공용 폴더는 guide/public(매니페스트·아이콘)만 쓴다. 서비스 워커는 두지 않는다.
 */
const BASE = SITE_BASE + 'guide/'

function guideHtml(): Plugin {
  return {
    name: 'guide-html',
    transformIndexHtml: (html) =>
      html
        .replace(/<title>[^<]*<\/title>/, '<title>USA 2026 · 미국 이공계 진로체험학습 사전 안내</title>')
        .replace('content="USA 2026"', 'content="USA 2026 안내"'),
  }
}

const base = baseConfig(true)

export default defineConfig({
  ...base,
  base: BASE,
  publicDir: 'guide/public',
  plugins: [...(base.plugins ?? []), guideHtml()],
  build: { ...base.build, outDir: 'dist/guide', emptyOutDir: true },
})
