import type { HttpMethod } from '@/types/api'

/** HTTP 方法选项 */
export const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

/** HTTP 方法对应的主题色 */
export const methodColors = {
  GET: 'text-emerald-600',
  POST: 'text-amber-600',
  PUT: 'text-blue-600',
  PATCH: 'text-purple-600',
  DELETE: 'text-rose-600',
  HEAD: 'text-slate-600',
  OPTIONS: 'text-cyan-600',
} as const

export const methodBadgeColors = {
  GET: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  POST: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  PUT: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  PATCH: 'bg-purple-500/15 text-purple-600 border-purple-500/30',
  DELETE: 'bg-rose-500/15 text-rose-600 border-rose-500/30',
  HEAD: 'bg-slate-500/15 text-slate-600 border-slate-500/30',
  OPTIONS: 'bg-cyan-500/15 text-cyan-600 border-cyan-500/30',
} as const
