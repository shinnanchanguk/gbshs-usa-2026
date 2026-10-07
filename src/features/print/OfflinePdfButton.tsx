import { useState } from 'react'
import { Icon } from '../../components/Icon'
import { useApp } from '../../app/context'
import { GUIDE } from '../../lib/edition'
import { saveBlob } from '../../lib/fileSave'
import { COMMON_PDF_URL } from './offline'

/** 인터넷이 없을 때 볼 PDF. 사전 안내판은 공통 안내만, 본 사이트는 내 정보·내 항공권까지 한 파일로. */
export function OfflinePdfButton() {
  return GUIDE ? <GuidePdfLink /> : <FullPdfButton />
}

function GuidePdfLink() {
  return (
    <a className="quick__btn" href={COMMON_PDF_URL} download="USA2026_오프라인안내.pdf">
      <Icon name="download" />
      오프라인 안내 PDF 받기
    </a>
  )
}

function FullPdfButton() {
  const { roster, profile, me, teacher } = useApp()
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')

  async function make() {
    setBusy(true)
    setNote('')
    try {
      const { buildOfflinePdf } = await import('./personalPdf')
      const r = await buildOfflinePdf({ roster, profile, me, teacher })
      saveBlob(r.blob, r.name)
      setNote(r.missingTicket ? '내 항공권은 빠졌어요. ZUDO로 로그인한 뒤 인터넷이 될 때 다시 받으면 함께 들어가요.' : '받았어요. 파일 앱(다운로드)에 저장돼 인터넷 없이 열려요.')
    } catch {
      setNote('만들지 못했어요. 인터넷이 될 때 한 번 더 눌러 주세요.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button type="button" className="quick__btn" onClick={() => void make()} disabled={busy}>
        <Icon name="download" />
        {busy ? '만드는 중' : '오프라인 안내 PDF 받기'}
      </button>
      {note ? <p className="fineprint">{note}</p> : null}
    </>
  )
}
