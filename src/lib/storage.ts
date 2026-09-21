/**
 * 브라우저 저장(localStorage).
 *
 * 이 사이트는 DB 없이 돌아간다. 출석·소감·피드백은 지금 쓰는 기기의 브라우저에만 남는다.
 * 사생활 보호 모드처럼 저장이 막힌 곳에서도 화면이 멈추지 않도록 실패하면 메모리에만 둔다.
 */
import { useCallback, useEffect, useState } from 'react'

const PREFIX = 'usa2026:'
const memory = new Map<string, string>()

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(PREFIX + key)
  } catch {
    return memory.get(key) ?? null
  }
}

function writeRaw(key: string, value: string) {
  try {
    window.localStorage.setItem(PREFIX + key, value)
  } catch {
    memory.set(key, value)
  }
}

export function readStored<T>(key: string, fallback: T): T {
  const raw = readRaw(key)
  if (raw == null) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

const listeners = new Map<string, Set<() => void>>()

export function writeStored<T>(key: string, value: T) {
  writeRaw(key, JSON.stringify(value))
  listeners.get(key)?.forEach((fn) => fn())
}

/** useState 와 같지만 값이 브라우저에 남고, 같은 키를 쓰는 다른 화면·탭과 함께 바뀐다. */
export function useStored<T>(key: string, fallback: T): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => readStored(key, fallback))

  useEffect(() => {
    const sync = () => setValue(readStored(key, fallback))
    const set = listeners.get(key) ?? new Set()
    set.add(sync)
    listeners.set(key, set)
    const onStorage = (e: StorageEvent) => {
      if (e.key === PREFIX + key) sync()
    }
    window.addEventListener('storage', onStorage)
    return () => {
      set.delete(sync)
      window.removeEventListener('storage', onStorage)
    }
    // fallback 은 처음 값으로만 쓴다.
  }, [key])

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = readStored(key, fallback)
      const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next
      writeStored(key, resolved)
    },
    [key],
  )

  return [value, update]
}
