/**
 * 명단을 만들 때 미리 그려 둔 QR(모듈 경로)을 그린다.
 * 카메라가 읽어야 하니 테마와 상관없이 흰 바탕에 검은 칸이다.
 */
export function QrCode({ size, path, label }: { size: number; path: string; label: string }) {
  return (
    <svg className="qr" viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label} shapeRendering="crispEdges" focusable="false">
      <rect width={size} height={size} fill="#fff" />
      <path d={path} fill="#000" />
    </svg>
  )
}
