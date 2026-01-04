import type { BundledLanguage, Highlighter } from 'shiki'
import { createHighlighter } from 'shiki'

export type SupportedLang = 'json' | 'javascript' | 'typescript' | 'html' | 'css' | 'shell' | 'plaintext'

let highlighterInstance: Highlighter | null = null
let highlighterPromise: Promise<Highlighter> | null = null

async function getHighlighter(): Promise<Highlighter> {
  if (highlighterInstance)
    return highlighterInstance

  if (highlighterPromise)
    return highlighterPromise

  highlighterPromise = createHighlighter({
    themes: ['github-light', 'github-dark'],
    langs: ['json', 'javascript', 'typescript', 'html', 'css', 'shell'] as BundledLanguage[],
  })

  highlighterInstance = await highlighterPromise
  return highlighterInstance
}

export async function highlightCode(code: string, lang: SupportedLang = 'json') {
  const highlighter = await getHighlighter()
  return highlighter.codeToHtml(code, {
    lang,
    themes: {
      light: 'github-light',
      dark: 'github-dark',
    },
    rootStyle: 'word-break: break-all; white-space: pre-wrap;',
  })
}
