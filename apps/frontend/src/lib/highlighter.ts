import { createHighlighter } from 'shiki'

export async function highlightCode(code: string, lang: string) {
  const highlighter = await createHighlighter({
    themes: ['github-light'],
    langs: ['json'],
  })
  return highlighter.codeToHtml(code, {
    lang,
    theme: 'github-light',
    rootStyle: false,
  })
}
