/** 만든 파일(PDF 등)을 휴대폰에 내려받게 한다. 아이폰은 '다운로드' 확인 뒤 파일 앱에 저장된다. */
export function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
