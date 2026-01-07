import type { HighlighterCore } from 'shiki/core'
import { createHighlighterCore } from 'shiki/core'
import { createOnigurumaEngine } from 'shiki/engine/oniguruma'

export type SupportedHighlightLang = 'json' | 'javascript' | 'typescript' | 'html' | 'css' | 'shellscript' | 'plaintext'

let highlighterInstance: HighlighterCore | null = null
let highlighterPromise: Promise<HighlighterCore> | null = null

async function getHighlighter(): Promise<HighlighterCore> {
  if (highlighterInstance)
    return highlighterInstance

  if (highlighterPromise)
    return highlighterPromise

  // 按需导入语言和主题
  highlighterPromise = createHighlighterCore({
    themes: [
      import('shiki/themes/github-light.mjs'),
      import('shiki/themes/github-dark.mjs'),
    ],
    langs: [
      import('shiki/langs/json.mjs'),
      import('shiki/langs/javascript.mjs'),
      import('shiki/langs/typescript.mjs'),
      import('shiki/langs/html.mjs'),
      import('shiki/langs/css.mjs'),
      import('shiki/langs/shellscript.mjs'),
    ],
    engine: createOnigurumaEngine(import('shiki/wasm')),
  })

  highlighterInstance = await highlighterPromise
  return highlighterInstance
}

export async function highlightCode(code: string, lang: SupportedHighlightLang = 'json') {
  if (lang === 'plaintext') {
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    return `<pre style="word-break: break-all; white-space: pre-wrap;"><code>${escaped}</code></pre>`
  }

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
