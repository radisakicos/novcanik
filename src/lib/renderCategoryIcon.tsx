import { CATEGORY_ICONS } from './category.constants'

/**
 * Renders the lucide icon stored on a category, or null when the stored name
 * is unknown (a category saved before an icon was removed from the set).
 */
export function renderCategoryIcon(name: string | null, size = 18, color?: string) {
  const entry = CATEGORY_ICONS.find(i => i.name === name)
  if (!entry) return null
  return <entry.component size={size} color={color} />
}
