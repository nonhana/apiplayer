import { pinyin } from 'pinyin-pro'

export function slugify(value: string): string {
  if (!value) {
    return ''
  }

  // 匹配中文
  const chineseRegex = /\p{Unified_Ideograph}/gu

  const transliterated = value.replace(chineseRegex, (match) => {
    return ` ${pinyin(match, { toneType: 'none', type: 'array' }).join(' ')} `
  })

  return transliterated
    .toLowerCase()
    .trim()
    .replace(/["']/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
