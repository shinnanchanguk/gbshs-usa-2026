import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
export function loadCatalog() {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'content/community.json'), 'utf8'))
  const pages = new Map()
  for (const file of fs.readdirSync(path.join(root, 'content/days'))) {
    if (!/^day\d+\.json$/.test(file)) continue
    const day = JSON.parse(fs.readFileSync(path.join(root, 'content/days', file), 'utf8'))
    for (const slide of day.slides) pages.set(slide.id, slide)
  }
  const locations = new Map()
  for (const region of catalog.regions) for (const key of region.pages) {
    if (!pages.get(key)?.place) throw new Error(`Unknown community location: ${key}`)
    if (locations.has(key)) throw new Error(`Duplicate community location: ${key}`)
    locations.set(key, { regionId: region.id, label: pages.get(key).title })
  }
  return { regions: new Set(catalog.regions.map((r) => r.id)), locations }
}
