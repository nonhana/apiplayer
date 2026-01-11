import { pinyin } from 'pinyin-pro'

export function slugify(value: string): string {
  if (!value) {
    return ''
  }

  const transliterated = pinyin(value, { toneType: 'none' })
  return transliterated
    .toLowerCase()
    .trim()
    .replace(/["']/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
