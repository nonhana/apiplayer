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
