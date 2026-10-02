/**
 * 학생이 장소에서 찍어 올린 사진의 원본 바이트를 두는 곳. 지금은 기기 브라우저(IndexedDB)다.
 *
 * localStorage 는 몇 MB 밖에 못 담아서 사진은 IndexedDB 에 따로 둔다. 어떤 사진이 어느 장에 있는지(목록)는 repo.ts 가 갖는다.
 * DB를 붙이면 바이트는 오브젝트 스토리지에, DB 에는 주소만 둔다(이 파일 대신 업로드 호출).
 * IndexedDB 가 막힌 브라우저(일부 사생활 보호 모드)에서는 이번에 연 동안만 메모리에 둔다.
 */

const DB_NAME = 'usa2026'
const STORE = 'field-photos'
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

function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  return openDb().then(
    (db) =>
      new Promise<T | undefined>((resolve, reject) => {
        if (!db) return reject(new Error('no-idb'))
        const tx = db.transaction(STORE, mode)
        const req = fn(tx.objectStore(STORE))
        tx.oncomplete = () => resolve(req.result)
        tx.onerror = () => reject(tx.error ?? new Error('idb'))
        tx.onabort = () => reject(tx.error ?? new Error('idb-abort'))
      }),
  )
}

/** 저장에 성공하면 true. 기기 저장이 막혀 메모리에만 뒀으면 false */
export async function putPhoto(id: string, blob: Blob): Promise<boolean> {
  try {
    await run('readwrite', (s) => s.put(blob, id))
    memory.delete(id)
    return true
  } catch {
    memory.set(id, blob)
    return false
  }
}

export async function getPhoto(id: string): Promise<Blob | null> {
  if (memory.has(id)) return memory.get(id)!
  try {
    const v = await run<unknown>('readonly', (s) => s.get(id))
    return v instanceof Blob ? v : null
  } catch {
    return null
  }
}

export async function deletePhoto(id: string): Promise<void> {
  memory.delete(id)
  try {
    await run('readwrite', (s) => s.delete(id))
  } catch {
    /* 지울 것이 없거나 저장이 막혔으면 그대로 둔다 */
  }
}

/** 브라우저가 공간이 모자랄 때 이 사이트 저장분을 먼저 지우지 않게 부탁한다(되는 브라우저만) */
export function askPersist() {
  try {
    void navigator.storage?.persist?.()
  } catch {
    /* 지원하지 않으면 그냥 둔다 */
  }
}

/** 올리는 사진의 긴 변(px). 휴대폰 화면에서 크게 봐도 충분하고 한 장이 수백 KB 안쪽이 된다. */
const MAX_EDGE = 1600
const QUALITY = 0.82
/** 이보다 큰 원본은 받지 않는다(휴대폰 사진은 보통 3~10MB) */
export const PHOTO_INPUT_MAX = 40 * 1024 * 1024

/**
 * 휴대폰 사진을 화면 크기로 줄여 JPEG 로 다시 만든다. 다시 그리면서 촬영 위치(GPS) 같은 EXIF 정보가 빠진다.
 * 사진을 열 수 없으면(이미지가 아님, 이 브라우저가 못 읽는 형식) null.
 */
export async function shrinkPhoto(file: Blob): Promise<{ blob: Blob; w: number; h: number } | null> {
  if (!file.type.startsWith('image/') || file.size > PHOTO_INPUT_MAX) return null
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await img.decode()
    // 브라우저가 EXIF 방향을 반영한 크기를 준다(세로로 찍은 사진이 눕지 않게)
    const w0 = img.naturalWidth
    const h0 = img.naturalHeight
    if (!w0 || !h0) return null
    const scale = Math.min(1, MAX_EDGE / Math.max(w0, h0))
    const w = Math.max(1, Math.round(w0 * scale))
    const h = Math.max(1, Math.round(h0 * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(img, 0, 0, w, h)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', QUALITY))
    canvas.width = canvas.height = 0
    return blob ? { blob, w, h } : null
  } catch {
    return null
  } finally {
    URL.revokeObjectURL(url)
  }
}
