import type { Page } from '../../content'
import { DayCover } from './DayCover'
import { SlideView } from './SlideView'

export function PageView({ page }: { page: Page }) {
  return page.type === 'day' ? <DayCover page={page} /> : <SlideView page={page} />
}
