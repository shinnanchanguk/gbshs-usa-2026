import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Marker, type Map as TripMap } from 'maplibre-gl'
import { Icon } from '../../components/Icon'
import { slidePages } from '../../content'
import { privateNotePins, type NotePin } from '../../lib/privateNoteModel'
import { usePersonalNotes } from './NoteContext'

const places = slidePages.map((page) => ({ key: page.key, day: page.day.n, title: page.slide.title, place: page.slide.place }))
type Portal = { pin: NotePin; element: HTMLElement }

/** 메모 본문은 지도 GeoJSON·외부 타일에 전달하지 않고 개인 패널에서만 표시한다. */
export function PrivateNoteMarkers({ map, day, currentKey, flight }: { map: TripMap | null; day: number; currentKey: string; flight: boolean }) {
  const { enabled, book, open } = usePersonalNotes()
  const keySignature = enabled && !flight ? JSON.stringify([...book.keys()].sort()) : '[]'
  const pins = useMemo(() => privateNotePins(places, new Set<string>(JSON.parse(keySignature)), day), [keySignature, day])
  const [portals, setPortals] = useState<Portal[]>([])
  const markers = useRef<Marker[]>([])

  useEffect(() => {
    if (!map) return
    const next = pins.map((pin) => ({ pin, element: document.createElement('div') }))
    markers.current = next.map(({ pin, element }) => new Marker({ element, anchor: 'center', offset: [28, -38] }).setLngLat(pin.coords).addTo(map))
    setPortals(next)
    return () => { markers.current.forEach((marker) => marker.remove()); markers.current = [] }
  }, [map, pins])

  // 로그아웃·역할 변경 때는 효과의 정리를 기다리지 않고 버튼을 가린다.
  if (!enabled || flight || !map) return null
  return <>{portals.map(({ element, pin }) => createPortal(
    <button type="button" className="map-private-note" aria-label={`내 메모 ${pin.pageKeys.length}개: ${pin.label}`} title={`${pin.label} 개인 메모`} data-note-keys={JSON.stringify(pin.pageKeys)} onClick={(e) => { e.stopPropagation(); open(pin.pageKeys, currentKey, e.currentTarget) }}>
      <Icon name="note" />{pin.pageKeys.length > 1 ? <span>{pin.pageKeys.length}</span> : null}
    </button>, element, JSON.stringify([day, ...pin.coords])) )}</>
}
