/**
 * 여행 지도 (MapLibre + OpenFreeMap, API 키 없음).
 *
 * 장을 넘길 때마다 지도가 따라간다.
 * - 장소가 있는 장: 앞 장소에서 이 장소까지 오는 길을 오렌지로 그리고, 두 곳이 함께 보이게 옮긴다.
 *   같은 곳이거나 아주 가까우면 그 장소로 가까이 다가간다.
 * - 일차 표지: 그날 동선 전체
 * - 출발 전·다녀와서, 장소 없는 장: 여행 전체 동선
 * - 비행기 장: 지구본으로 바꿔 인천에서 JFK 까지 대원 호를 그린다.
 * 카메라는 지도 칸이 실제로 보이는 넓이 안에서 여백을 두고 맞춘다(가려지는 부분이 없다).
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Map as MapLibre, AttributionControl, setWorkerUrl, type GeoJSONSource, type LngLatBoundsLike } from 'maplibre-gl'
// MapLibre 6 의 워커는 옆 파일을 불러오므로, Vite 가 워커와 그 의존 파일을 함께 묶은 주소를 알려 준다.
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec'
import { slidePages, trip, type Page, type SlidePage } from '../../content'
import { bbox, greatCircle, type LngLat } from '../../lib/geo'
import { paintPaper } from './paint'

setWorkerUrl(maplibreWorkerUrl)

const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron'
const ICN: LngLat = [126.4406, 37.4602]
const JFK: LngLat = [-73.7781, 40.6413]
const INK = '#111111'
const ACCENT = '#ed5a14'
const PAPER = '#fbf8f2'
const SHEET = '#fbfaf7'

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/** 미국 안에 있는 장소만 (인천은 전체 동선 계산에서 뺀다) */
const inUS = (c: LngLat) => c[0] < -60

type LegFeature = GeoJSON.Feature<GeoJSON.LineString, { day: number; mode: string; to: string; index: number }>

function legLine(p: SlidePage): LngLat[] | null {
  if (!p.slide.leg || !p.from?.slide.place || !p.slide.place) return null
  const a = p.from.slide.place.coords as LngLat
  const b = p.slide.place.coords as LngLat
  if (!inUS(a) || !inUS(b)) return null
  if (p.route?.coords.length) return p.route.coords
  return [a, b]
}

function buildData() {
  const legs: LegFeature[] = []
  const stops: GeoJSON.Feature<GeoJSON.Point>[] = []
  const seen = new Map<string, number>()
  for (const p of slidePages) {
    const place = p.slide.place
    if (!place) continue
    const line = legLine(p)
    if (line && line.length > 1) {
      legs.push({
        type: 'Feature',
        properties: { day: p.day.n, mode: p.slide.leg?.mode ?? 'bus', to: p.key, index: p.index },
        geometry: { type: 'LineString', coordinates: line },
      })
    }
    // 같은 좌표에 여러 장이 있으면(같은 장소에서 이어지는 일정) 첫 장 번호만 핀으로 둔다.
    const coordKey = `${p.day.n}:${place.coords.join(',')}`
    if (seen.has(coordKey)) continue
    seen.set(coordKey, p.index)
    stops.push({
      type: 'Feature',
      properties: { key: p.key, day: p.day.n, pin: p.pin, index: p.index, hotel: p.slide.kind === 'hotel', name: place.name },
      geometry: { type: 'Point', coordinates: place.coords },
    })
  }
  return { legs, stops }
}

/** 이 장에서 카메라가 담을 점들 */
function framePoints(page: Page): { points: LngLat[]; zoomIn: boolean } {
  const allUS = slidePages.flatMap((p) => (p.slide.place && inUS(p.slide.place.coords as LngLat) ? [p.slide.place.coords as LngLat] : []))
  if (page.type === 'day') {
    const dayPts = page.chapter.pages.flatMap((p) => (p.type === 'slide' && p.slide.place ? [p.slide.place.coords as LngLat] : []))
    const us = dayPts.filter(inUS)
    if (us.length) {
      // 그날 첫 장소로 오는 길(앞날 숙소)도 담는다
      const first = page.chapter.pages.find((p): p is SlidePage => p.type === 'slide' && !!p.slide.place)
      const from = first?.from?.slide.place?.coords as LngLat | undefined
      return { points: from && inUS(from) ? [from, ...us] : us, zoomIn: false }
    }
    return { points: dayPts.length ? dayPts : allUS, zoomIn: dayPts.length > 0 }
  }
  const place = page.slide.place
  if (!place) return { points: allUS, zoomIn: false }
  const here = place.coords as LngLat
  if (!inUS(here)) return { points: [here], zoomIn: true }
  const line = legLine(page)
  if (line && page.crowKm && page.crowKm > 0.25) return { points: [...line, here], zoomIn: false }
  return { points: [here], zoomIn: true }
}

export function TripMap({ page, onSelect }: { page: Page; onSelect: (key: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibre | null>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const data = useMemo(buildData, [])
  const selectRef = useRef(onSelect)
  selectRef.current = onSelect
  const animRef = useRef<number | null>(null)

  // 지도 만들기 (한 번)
  useEffect(() => {
    if (!containerRef.current) return
    let map: MapLibre
    try {
      map = new MapLibre({
        container: containerRef.current,
        style: STYLE_URL,
        center: [-74.2, 41.2],
        zoom: 5.2,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
        fadeDuration: 0,
        // 한글 이름은 지도 글꼴 대신 기기 글꼴로 그린다.
        localIdeographFontFamily: "'Wanted Sans', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', sans-serif",
      })
    } catch {
      setFailed(true)
      return
    }
    map.touchZoomRotate.disableRotation()
    map.addControl(new AttributionControl({ compact: true }), 'bottom-right')
    map.once('style.load', () => {
      paintPaper(map)
      map.addSource('legs', { type: 'geojson', data: { type: 'FeatureCollection', features: data.legs } })
      map.addSource('stops', { type: 'geojson', data: { type: 'FeatureCollection', features: data.stops } })
      // 그날 장소는 따로 묶어, 멀리서 볼 때 가까운 장소끼리 "2–4" 처럼 한 핀으로 합친다(가까이 다가가면 다시 나뉜다)
      map.addSource('stops-day', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterRadius: 26,
        clusterMaxZoom: 14,
        clusterProperties: { minPin: ['min', ['get', 'pin']], maxPin: ['max', ['get', 'pin']], minIndex: ['min', ['get', 'index']] },
      })
      map.addSource('hotels', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: trip.hotels.map((h) => ({
            type: 'Feature' as const,
            properties: { label: `${h.name.replace(/^.*?(내슈아|하노버|베데스다).*$/, '$1')} ${h.nights.length}박` },
            geometry: { type: 'Point' as const, coordinates: h.coords },
          })),
        },
      })
      map.addSource('leg-now', { type: 'geojson', lineMetrics: true, data: { type: 'FeatureCollection', features: [] } })
      map.addSource('flight', { type: 'geojson', lineMetrics: true, data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: greatCircle(ICN, JFK) } } })
      map.addSource('airports', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            { type: 'Feature', properties: { name: '인천' }, geometry: { type: 'Point', coordinates: ICN } },
            { type: 'Feature', properties: { name: '뉴욕 JFK' }, geometry: { type: 'Point', coordinates: JFK } },
          ],
        },
      })
      const round = { 'line-cap': 'round', 'line-join': 'round' } as const
      // 다른 날 동선: 아주 옅게
      map.addLayer({ id: 'legs-all', type: 'line', source: 'legs', layout: round, paint: { 'line-color': INK, 'line-opacity': 0.14, 'line-width': 1.5 } })
      // 그날 동선: 버스는 실선, 걷기는 점선
      map.addLayer({ id: 'legs-day', type: 'line', source: 'legs', layout: round, filter: ['==', ['get', 'day'], -1], paint: { 'line-color': INK, 'line-opacity': 0.72, 'line-width': 2.6 } })
      map.addLayer({
        id: 'legs-day-walk',
        type: 'line',
        source: 'legs',
        layout: round,
        filter: ['==', ['get', 'day'], -1],
        paint: { 'line-color': INK, 'line-opacity': 0.8, 'line-width': 2.4, 'line-dasharray': [0.2, 2] },
      })
      // 지금 장으로 오는 길: 오렌지, 그려지듯 나타난다
      map.addLayer({
        id: 'leg-now-casing',
        type: 'line',
        source: 'leg-now',
        layout: round,
        paint: { 'line-color': PAPER, 'line-width': 9, 'line-opacity': 0.9 },
      })
      map.addLayer({
        id: 'leg-now',
        type: 'line',
        source: 'leg-now',
        layout: round,
        paint: { 'line-width': 5, 'line-gradient': ['interpolate', ['linear'], ['line-progress'], 0, ACCENT, 1, ACCENT] },
      })
      // 비행 호
      // 비행 호: 크로마 그라데이션(파랑 → 보라 → 분홍 → 오렌지)
      map.addLayer({
        id: 'flight',
        type: 'line',
        source: 'flight',
        layout: { ...round, visibility: 'none' },
        paint: { 'line-width': 4, 'line-gradient': ['interpolate', ['linear'], ['line-progress'], 0, '#1e5fce', 0.4, '#7a42b8', 0.72, '#c9477f', 1, ACCENT] },
      })
      map.addLayer({ id: 'airports', type: 'circle', source: 'airports', layout: { visibility: 'none' }, paint: { 'circle-radius': 6, 'circle-color': INK, 'circle-stroke-color': PAPER, 'circle-stroke-width': 2 } })
      map.addLayer({
        id: 'airport-labels',
        type: 'symbol',
        source: 'airports',
        layout: { visibility: 'none', 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Bold'], 'text-size': 13, 'text-offset': [0, 1.3], 'text-anchor': 'top' },
        paint: { 'text-color': INK, 'text-halo-color': PAPER, 'text-halo-width': 2 },
      })
      // 다른 날 장소: 작은 점
      map.addLayer({ id: 'stops-all', type: 'circle', source: 'stops', paint: { 'circle-radius': 2.5, 'circle-color': INK, 'circle-opacity': 0.25 } })
      // 그날 장소: 번호 핀 (지나온 곳은 흐리게)
      const idx = ['coalesce', ['get', 'index'], ['get', 'minIndex']] as ExpressionSpecification
      map.addLayer({
        id: 'stops-day',
        type: 'circle',
        source: 'stops-day',
        paint: {
          'circle-radius': ['case', ['has', 'point_count'], 13, 10],
          'circle-color': ['case', ['<', idx, ['global-state', 'current']], '#e4ded2', SHEET],
          'circle-stroke-color': INK,
          'circle-stroke-width': ['case', ['<', idx, ['global-state', 'current']], 1.2, 1.8],
        },
      })
      map.addLayer({
        id: 'stops-day-num',
        type: 'symbol',
        source: 'stops-day',
        layout: {
          'text-field': ['case', ['has', 'point_count'], ['concat', ['to-string', ['get', 'minPin']], '-', ['to-string', ['get', 'maxPin']]], ['to-string', ['get', 'pin']]],
          'text-font': ['Noto Sans Bold'],
          'text-size': ['case', ['has', 'point_count'], 10, 11],
          'text-allow-overlap': true,
          // 우리 핀 자리를 비워 두게 해 바탕 지명이 핀 밑에 깔리지 않게 한다
          'text-ignore-placement': false,
          'text-padding': 9,
        },
        paint: { 'text-color': INK },
      })
      // 숙소 (출발 전 표지·버스·숙소 장에서)
      map.addLayer({ id: 'hotels', type: 'circle', source: 'hotels', layout: { visibility: 'none' }, paint: { 'circle-radius': 7, 'circle-color': INK, 'circle-stroke-color': PAPER, 'circle-stroke-width': 2 } })
      map.addLayer({
        id: 'hotel-labels',
        type: 'symbol',
        source: 'hotels',
        layout: { visibility: 'none', 'text-field': ['get', 'label'], 'text-font': ['Noto Sans Bold'], 'text-size': 12, 'text-anchor': 'left', 'text-offset': [1, 0], 'text-allow-overlap': true, 'text-ignore-placement': false, 'text-padding': 4 },
        paint: { 'text-color': INK, 'text-halo-color': PAPER, 'text-halo-width': 2 },
      })
      // 지금 장소
      map.addLayer({ id: 'stop-now-halo', type: 'circle', source: 'stops', filter: ['==', ['get', 'key'], ''], paint: { 'circle-radius': 22, 'circle-color': ACCENT, 'circle-opacity': 0.18 } })
      map.addLayer({ id: 'stop-now', type: 'circle', source: 'stops', filter: ['==', ['get', 'key'], ''], paint: { 'circle-radius': 13, 'circle-color': ACCENT, 'circle-stroke-color': INK, 'circle-stroke-width': 2 } })
      map.addLayer({
        id: 'stop-now-num',
        type: 'symbol',
        source: 'stops',
        filter: ['==', ['get', 'key'], ''],
        layout: { 'text-field': ['to-string', ['get', 'pin']], 'text-font': ['Noto Sans Bold'], 'text-size': 13, 'text-allow-overlap': true, 'text-ignore-placement': false, 'text-padding': 10 },
        paint: { 'text-color': INK },
      })
      map.addLayer({
        id: 'stop-now-label',
        type: 'symbol',
        source: 'stops',
        filter: ['==', ['get', 'key'], ''],
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Noto Sans Bold'],
          'text-size': 13,
          'text-anchor': 'left',
          'text-offset': [1.4, 0],
          'text-max-width': 9,
          'text-allow-overlap': true,
        },
        paint: { 'text-color': INK, 'text-halo-color': PAPER, 'text-halo-width': 2.2 },
      })
      map.setGlobalStateProperty('current', -1)
      for (const id of ['stops-day', 'stops-day-num', 'stop-now']) {
        map.on('click', id, (e) => {
          const f = e.features?.[0]
          if (f?.properties?.point_count) {
            map.easeTo({ center: (f.geometry as GeoJSON.Point).coordinates as LngLat, zoom: map.getZoom() + 2.5 })
            return
          }
          const key = f?.properties?.key
          if (typeof key === 'string') selectRef.current(key)
        })
        map.on('mouseenter', id, () => (map.getCanvas().style.cursor = 'pointer'))
        map.on('mouseleave', id, () => (map.getCanvas().style.cursor = ''))
      }
      setReady(true)
    })
    map.on('error', (e) => {
      if (import.meta.env.DEV) console.warn('[map]', e.error?.message)
      if (!map.isStyleLoaded() && /style/i.test(String(e.error?.message ?? ''))) setFailed(true)
    })
    if (import.meta.env.DEV) (window as unknown as { __map?: MapLibre }).__map = map
    const collapseAttribution = () => containerRef.current?.querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show')
    map.once('load', collapseAttribution)
    map.once('idle', collapseAttribution)
    mapRef.current = map
    const ro = new ResizeObserver(() => map.resize())
    ro.observe(containerRef.current)
    return () => {
      ro.disconnect()
      if (animRef.current) cancelAnimationFrame(animRef.current)
      map.remove()
      mapRef.current = null
    }
  }, [data])

  // 장이 바뀌면: 강조·경로·카메라
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const dayN = page.day.n
    const isFlight = page.type === 'slide' && page.slide.kind === 'flight' && page.day.n <= 9
    const set = (id: string, filter: unknown) => map.getLayer(id) && map.setFilter(id, filter as never)

    map.setGlobalStateProperty('current', page.index)
    set('legs-day', ['all', ['==', ['get', 'day'], dayN], ['!=', ['get', 'mode'], 'walk']])
    set('legs-day-walk', ['all', ['==', ['get', 'day'], dayN], ['==', ['get', 'mode'], 'walk']])
    // 그날 장소(1~9일차에만)
    const daySrc = map.getSource('stops-day') as GeoJSONSource | undefined
    // 비행 장(지구본)에서는 그날 핀을 감춰 호만 보이게 한다
    // 지금 장소는 따로 크게 그리므로 묶음에서 뺀다(같은 번호가 두 번 보이지 않게)
    const nowStopKey = page.type === 'slide' && page.slide.place ? stopKeyFor(page) : ''
    daySrc?.setData({
      type: 'FeatureCollection',
      features: dayN >= 1 && dayN <= 9 && !isFlight ? data.stops.filter((f) => f.properties?.day === dayN && f.properties?.key !== nowStopKey) : [],
    })
    // 출발 전·다녀와서: 전체 동선을 또렷하게, 숙소 3곳 표시
    const guide = dayN === 0 || dayN === 10
    map.setPaintProperty('legs-all', 'line-opacity', guide ? 0.55 : 0.14)
    map.setPaintProperty('legs-all', 'line-width', guide ? 2.2 : 1.5)
    for (const id of ['hotels', 'hotel-labels']) map.setLayoutProperty(id, 'visibility', guide ? 'visible' : 'none')
    for (const id of ['stop-now-halo', 'stop-now', 'stop-now-num', 'stop-now-label']) set(id, ['==', ['get', 'key'], nowStopKey])

    // 비행: 지구본 + 호
    const flightVis = isFlight ? 'visible' : 'none'
    // 귀국편은 색이 JFK 쪽에서 시작하도록 뒤집는다
    const homeward = isFlight && page.day.n >= 7
    map.setPaintProperty(
      'flight',
      'line-gradient',
      homeward
        ? ['interpolate', ['linear'], ['line-progress'], 0, ACCENT, 0.28, '#c9477f', 0.6, '#7a42b8', 1, '#1e5fce']
        : ['interpolate', ['linear'], ['line-progress'], 0, '#1e5fce', 0.4, '#7a42b8', 0.72, '#c9477f', 1, ACCENT],
    )
    // 지구본에서는 공항 이름표가 있으니 지금 장소 이름표를 감춘다
    map.setLayoutProperty('stop-now-label', 'visibility', isFlight ? 'none' : 'visible')
    for (const id of ['flight', 'airports', 'airport-labels']) map.setLayoutProperty(id, 'visibility', flightVis)
    map.setProjection({ type: isFlight ? 'globe' : 'mercator' })

    // 지금 장으로 오는 길을 그리듯 보여 준다
    const legSrc = map.getSource('leg-now') as GeoJSONSource | undefined
    const line = page.type === 'slide' ? legLine(page) : null
    legSrc?.setData(line && line.length > 1 ? { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: line } } : { type: 'FeatureCollection', features: [] })
    if (animRef.current) cancelAnimationFrame(animRef.current)
    const drawTo = (t: number) =>
      map.setPaintProperty('leg-now', 'line-gradient', ['step', ['line-progress'], ACCENT, Math.max(0.0001, Math.min(0.9999, t)), 'rgba(237,90,20,0)'])
    if (line && !reduceMotion()) {
      const t0 = performance.now()
      const step = (ts: number) => {
        const k = Math.min(1, (ts - t0) / 700)
        drawTo(1 - Math.pow(1 - k, 3))
        if (k < 1) animRef.current = requestAnimationFrame(step)
      }
      drawTo(0)
      animRef.current = requestAnimationFrame(step)
    } else drawTo(1)

    // 카메라
    const duration = reduceMotion() ? 0 : 900
    if (isFlight) {
      // 인천에서 알래스카 위를 지나 JFK 까지 호 전체가 보이게 지구본을 돌린다
      const wide = (containerRef.current?.clientWidth ?? 390) > 700
      map.easeTo({ center: [-178, 56], zoom: wide ? 1.55 : 0.55, duration: reduceMotion() ? 0 : 1400 })
      return
    }
    const { points, zoomIn } = framePoints(page)
    const box = bbox(points)
    if (!box) return
    const el = containerRef.current
    const w = el?.clientWidth ?? 390
    const h = el?.clientHeight ?? 280
    // 지금 장소의 이름표는 핀 오른쪽에 붙고, 오른쪽 위에는 지도 크게 단추가 있다. 그만큼 비워 두고 맞춘다.
    const hasLabel = page.type === 'slide' && !!page.slide.place
    const base = Math.max(24, Math.min(56, Math.round(Math.min(w, h) * 0.1)))
    const padding = {
      top: base + (w < 960 ? 34 : 0),
      bottom: base,
      left: base,
      right: base + (hasLabel ? Math.min(150, Math.round(w * 0.34)) : w < 960 ? 34 : 0),
    }
    if (zoomIn) {
      // 핀을 가운데보다 왼쪽 아래에 두어 이름표와 단추가 겹치지 않게
      map.easeTo({ center: points[0], zoom: 15, offset: [hasLabel ? -Math.round(Math.min(150, w * 0.34) / 2) : 0, 14], duration })
    } else {
      map.fitBounds(box as LngLatBoundsLike, { padding, maxZoom: 15, duration, linear: false })
    }
  }, [page, ready])

  return (
    <div className="map">
      <div ref={containerRef} className="map__canvas" role="region" aria-label="여행 동선 지도" />
      {failed ? (
        <div className="map__fail" role="status">
          <p>지도를 불러오지 못했어요. 인터넷이 연결되면 다시 보여요. 일정 안내는 그대로 볼 수 있어요.</p>
        </div>
      ) : null}
    </div>
  )
}

/** 같은 좌표의 여러 장은 첫 장의 핀을 쓴다 */
function stopKeyFor(page: SlidePage): string {
  const c = page.slide.place!.coords.join(',')
  const first = page.chapter.pages.find((p): p is SlidePage => p.type === 'slide' && !!p.slide.place && p.slide.place.coords.join(',') === c)
  return first?.key ?? page.key
}

