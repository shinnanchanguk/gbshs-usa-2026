/**
 * 여행 지도 (MapLibre + OpenFreeMap, API 키 없음).
 *
 * - 처음에는 미국 동부 전체 경로를 보여 주고, 일차를 고르면 그날 장소들로 날아가 확대한다.
 * - 장소마다 시간 순서 번호 핀을 찍고, 지금 보고 있는 슬라이드의 핀을 라임색으로 강조한다.
 * - 출석판이 있는 장소의 핀 아래에는 반별 출석 완료 점(1~5반)을 붙인다.
 * - 핀 옆에 "14:30 예일대" 같은 시각·이름 라벨을 달아 그날 일정이 지도에서 한눈에 보이게 한다
 *   (라벨은 지도 심볼 레이어라 서로 겹치면 지도가 알아서 몇 개를 숨긴다).
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { LngLatBounds, Map as MapLibre, Marker, NavigationControl, AttributionControl, setWorkerUrl, type GeoJSONSource } from 'maplibre-gl'
// MapLibre 6 의 워커는 옆 파일(maplibre-gl-shared.mjs)을 불러오므로, Vite 가 워커와 그 의존 파일을 함께 묶은 주소를 알려 준다.
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import type { AllPaintProperties } from '@maplibre/maplibre-gl-style-spec'
import 'maplibre-gl/dist/maplibre-gl.css'
import { deck, days, trip, type DeckSlide } from '../../content'
import { isComplete, type AttendanceBook } from '../../app/state'
import { goToSlide } from '../../lib/router'

setWorkerUrl(maplibreWorkerUrl)

const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron'
const US_EAST_VIEW = { center: [-74.2, 41.2] as [number, number], zoom: 5.4 }

/** Expedition 팔레트로 지도 바탕색을 맞춘다. 스타일에 없는 레이어는 건너뛴다. */
function paintExpedition(map: MapLibre) {
  const set = <K extends keyof AllPaintProperties>(layer: string, prop: K, value: AllPaintProperties[K]) => {
    if (map.getLayer(layer)) {
      try {
        map.setPaintProperty(layer, prop, value)
      } catch {
        /* 레이어 종류가 달라 속성이 없으면 그냥 둔다 */
      }
    }
  }
  set('background', 'background-color', '#F7F9FB')
  set('water', 'fill-color', '#D7E4EA')
  set('park', 'fill-color', '#E9EEE6')
  set('landcover_wood', 'fill-color', '#EDF1EA')
  set('landuse_residential', 'fill-color', '#F1F3F4')
  set('building', 'fill-color', '#E6E2D6')
  for (const layer of map.getStyle().layers ?? []) {
    // 바탕 지명은 연하게 두어 우리 일정 라벨(진한 색)이 먼저 눈에 들어오게 한다.
    if (layer.type === 'symbol' && layer.id.startsWith('label_')) set(layer.id, 'text-color', '#8AA0AB')
    if (layer.id.startsWith('boundary_')) set(layer.id, 'line-color', '#9DB1BA')
  }
}

type DayLine = { n: number; coords: [number, number][] }

function dayLines(): DayLine[] {
  return days
    .filter((d) => d.n > 0)
    .map((d) => ({
      n: d.n,
      // 인천(경도 126°)은 미국 지도 경로에서 뺀다.
      coords: d.slides.flatMap((s) => (s.place && s.place.coords[0] < 0 ? [s.place.coords] : [])),
    }))
    .filter((l) => l.coords.length > 1)
}

function boundsOf(coords: [number, number][]): LngLatBounds | null {
  if (!coords.length) return null
  const b = new LngLatBounds(coords[0], coords[0])
  for (const c of coords) b.extend(c)
  return b
}

function pinElement(slide: DeckSlide, book: AttendanceBook, showAttendance: boolean): HTMLButtonElement {
  const el = document.createElement('button')
  el.type = 'button'
  el.className = 'map-pin'
  el.setAttribute('aria-label', `${slide.pin}. ${slide.title}`)
  el.title = `${slide.time?.start ?? ''} ${slide.title}`.trim()
  const num = document.createElement('span')
  num.className = 'map-pin__num'
  num.textContent = String(slide.pin)
  el.appendChild(num)
  if (showAttendance && slide.attendance) {
    const dots = document.createElement('span')
    dots.className = 'map-pin__att'
    for (const c of trip.classes) {
      const dot = document.createElement('i')
      dot.textContent = String(c.no)
      dot.dataset.done = String(isComplete(book, slide.id, c.no))
      dots.appendChild(dot)
    }
    el.appendChild(dots)
  }
  el.addEventListener('click', (e) => {
    e.stopPropagation()
    goToSlide(slide.id)
  })
  return el
}

export function TripMap({ current, book, showAttendance }: { current: DeckSlide; book: AttendanceBook; showAttendance: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibre | null>(null)
  const markersRef = useRef<Marker[]>([])
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const lines = useMemo(dayLines, [])
  const dayN = current.day.n

  // 지도 만들기 (한 번)
  useEffect(() => {
    if (!containerRef.current) return
    let map: MapLibre
    try {
      map = new MapLibre({
        container: containerRef.current,
        style: STYLE_URL,
        center: US_EAST_VIEW.center,
        zoom: US_EAST_VIEW.zoom,
        attributionControl: false,
        cooperativeGestures: false,
        dragRotate: false,
        pitchWithRotate: false,
        // 한글 라벨은 지도 글꼴 대신 기기 글꼴로 그린다.
        localIdeographFontFamily: "'Manrope', 'Malgun Gothic', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
      })
    } catch {
      setFailed(true)
      return
    }
    map.touchZoomRotate.disableRotation()
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right')
    map.addControl(new AttributionControl({ compact: true }), 'bottom-right')
    // 타일을 다 받을 때까지('load') 기다리지 않고, 스타일만 준비되면 경로·핀·라벨을 바로 올린다.
    map.once('style.load', () => {
      paintExpedition(map)
      map.addSource('routes', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: lines.map((l) => ({ type: 'Feature', properties: { n: l.n }, geometry: { type: 'LineString', coordinates: l.coords } })),
        },
      })
      map.addLayer({
        id: 'routes-all',
        type: 'line',
        source: 'routes',
        paint: { 'line-color': '#2C5263', 'line-opacity': 0.28, 'line-width': 2 },
        layout: { 'line-cap': 'round', 'line-join': 'round' },
      })
      map.addSource('stops', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.addLayer({
        id: 'stop-labels',
        type: 'symbol',
        source: 'stops',
        layout: {
          'text-field': ['get', 'label'],
          'text-font': ['Noto Sans Bold'],
          'text-size': ['case', ['get', 'active'], 14, 12],
          'text-anchor': 'left',
          'text-offset': [1.45, 0],
          'text-max-width': 10,
          'text-justify': 'left',
          'symbol-sort-key': ['case', ['get', 'active'], 0, 1],
        },
        paint: {
          'text-color': ['case', ['get', 'active'], '#0C2D3A', '#2C5263'],
          'text-halo-color': 'rgba(255, 255, 255, 0.95)',
          'text-halo-width': 2,
        },
      })
      map.addLayer({
        id: 'routes-day',
        type: 'line',
        source: 'routes',
        filter: ['==', ['get', 'n'], -1],
        paint: { 'line-color': '#0C2D3A', 'line-width': 3, 'line-dasharray': [1.5, 1.5] },
        layout: { 'line-cap': 'round', 'line-join': 'round' },
      })
      setReady(true)
    })
    map.on('error', (e) => {
      // 타일 한두 장 실패는 무시하고, 스타일 자체를 못 받으면 안내를 띄운다.
      if (!map.isStyleLoaded() && /style/i.test(String(e.error?.message ?? ''))) setFailed(true)
    })
    // 출처 글이 지도를 가리지 않게 ⓘ 단추로 접어 둔다(누르면 펼쳐짐). MapLibre 가 첫 로딩 뒤 다시 펼치므로 그때도 접는다.
    const collapseAttribution = () => containerRef.current?.querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show')
    map.once('load', collapseAttribution)
    map.once('idle', collapseAttribution)
    mapRef.current = map
    const ro = new ResizeObserver(() => map.resize())
    ro.observe(containerRef.current)
    return () => {
      ro.disconnect()
      map.remove()
      mapRef.current = null
    }
  }, [lines])

  // 카메라가 슬라이드 흐름을 따라간다.
  // - 공통 안내: 여행 전체 경로
  // - 그날 첫 슬라이드: 그날 동선 전체
  // - 그 뒤: "이전 장소 → 지금 장소 → 다음 장소"가 들어오게 (같은 도시 안의 장소가 뭉치지 않게 확대)
  // - 한국(인천) 장소: 그 장소로
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    map.setFilter('routes-day', ['==', ['get', 'n'], dayN])
    const narrow = (containerRef.current?.clientWidth ?? 800) < 520
    // 핀 아래 출석 점과 오른쪽 라벨이 잘리지 않게 아래·오른쪽 여백을 조금 더 준다.
    const padding = narrow ? { top: 40, bottom: 56, left: 36, right: 90 } : { top: 72, bottom: 90, left: 64, right: 150 }
    const inUS = (c: [number, number]) => c[0] < 0

    if (current.place && !inUS(current.place.coords)) {
      map.flyTo({ center: current.place.coords, zoom: 12, duration: 1200 })
      return
    }
    const daySlides = current.day.slides
    const dayCoords = daySlides.flatMap((s) => (s.place && inUS(s.place.coords) ? [s.place.coords] : []))
    let coords: [number, number][]
    if (dayN === 0) coords = lines.flatMap((l) => l.coords)
    else if (current.order === 1 || !current.place) coords = dayCoords
    else {
      const i = current.order - 1
      const prev = daySlides.slice(0, i).reverse().find((s) => s.place && inUS(s.place.coords))
      const next = daySlides.slice(i + 1).find((s) => s.place && inUS(s.place.coords))
      coords = [prev?.place?.coords, current.place.coords, next?.place?.coords].filter((c): c is [number, number] => !!c)
    }
    const bounds = boundsOf(coords)
    if (bounds) map.fitBounds(bounds, { padding, maxZoom: 15, duration: 1200 })
    else map.flyTo({ ...US_EAST_VIEW, duration: 1200 })
  }, [current.id, dayN, ready, lines]) // 슬라이드가 바뀔 때마다 카메라를 다시 맞춘다

  // 그날 핀 다시 찍기 (출석 상태·현재 슬라이드가 바뀌어도 새로 그린다)
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    for (const m of markersRef.current) m.remove()
    const pins = deck.filter((s) => s.day.n === dayN && s.place)
    map.getSource<GeoJSONSource>('stops')?.setData({
      type: 'FeatureCollection',
      features: pins.map((slide) => ({
        type: 'Feature',
        properties: { label: `${slide.time ? slide.time.start + ' ' : ''}${slide.title}`, active: slide.id === current.id },
        geometry: { type: 'Point', coordinates: slide.place!.coords },
      })),
    })
    markersRef.current = pins.map((slide) => {
      const el = pinElement(slide, book, showAttendance)
      if (slide.id === current.id) el.dataset.active = 'true'
      return new Marker({ element: el, anchor: 'center' }).setLngLat(slide.place!.coords).addTo(map)
    })
  }, [dayN, ready, current.id, current.place, book, showAttendance])

  return (
    <div className="trip-map">
      <div ref={containerRef} className="trip-map__canvas" />
      {!ready && !failed && <p className="trip-map__loading">지도를 불러오는 중…</p>}
      {failed && <p className="trip-map__error">지도를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.</p>}
    </div>
  )
}
