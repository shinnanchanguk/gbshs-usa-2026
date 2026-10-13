import catalog from '../../../content/community.json'
import { pageByKey } from '../../content'

export const regions = catalog.regions
export const locations = regions.flatMap((region) => region.pages.flatMap((key) => {
  const page = pageByKey.get(key)
  return page?.type === 'slide' ? [{ key, regionId: region.id, label: page.slide.title }] : []
}))
export const locationByKey = new Map(locations.map((place) => [place.key, place]))
export const regionLabel = (id: string) => regions.find((r) => r.id === id)?.label ?? '공통'
