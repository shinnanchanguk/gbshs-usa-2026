/**
 * 내 전자항공권 PDF 를 이 기기에 저장해 두는 곳(IndexedDB). 한 번 받으면 인터넷이 없어도 연다.
 * 원본은 ZUDO 비공개 저장소에 있고, 받을 때마다 ZUDO 가 본인·자녀·인솔 교사인지 확인한다.
 * IndexedDB 가 막힌 브라우저에서는 이번에 연 동안만 메모리에 둔다.
 */
import { zudoFetch, ZudoError } from './zudo'

const DB_NAME = 'usa2026-tickets'
const STORE = 'tickets'
const memory = new Map<string, Blob>()
let dbPromise: Promise<IDBDatabase | null> | null = null

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null)
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE)
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
      req.onblocked = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
  return dbPromise
}

async function idb<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  const db = await openDb()
  if (!db) throw new Error('no-idb')
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const req = fn(tx.objectStore(STORE))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function savedTicket(studentId: string): Promise<Blob | null> {
  if (memory.has(studentId)) return memory.get(studentId)!
  try {
    const v = await idb<Blob>('readonly', (s) => s.get(studentId) as IDBRequest<Blob>)
    return v instanceof Blob ? v : null
  } catch {
    return null
  }
}

/** ZUDO 에서 받아 이 기기에 저장하고 돌려준다 */
export async function downloadTicket(studentId: string): Promise<Blob> {
  const res = await zudoFetch(`/api/trip/ticket?student=${encodeURIComponent(studentId)}`)
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new ZudoError(res.status, body.error ?? 'failed')
  }
  const blob = await res.blob()
  if (blob.type !== 'application/pdf' || blob.size < 1000) throw new ZudoError(500, 'bad_file')
  try {
    await idb('readwrite', (s) => s.put(blob, studentId))
  } catch {
    memory.set(studentId, blob)
  }
  return blob
}

/** 저장해 둔 것이 있으면 그것을, 없으면 받아 온다 */
export async function getTicket(studentId: string): Promise<Blob> {
  return (await savedTicket(studentId)) ?? downloadTicket(studentId)
}

export async function forgetTickets() {
  memory.clear()
  try {
    await idb('readwrite', (s) => s.clear())
  } catch {
    // 저장소가 없으면 지울 것도 없다
  }
}
