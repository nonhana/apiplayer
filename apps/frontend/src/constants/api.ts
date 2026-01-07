import type { RequestBodyType } from '@/types/api'

/** HTTP 方法选项 */
export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const

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

/** HTTP 请求方法对应的样式 */
export const methodBadgeColors = {
  GET: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  POST: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  PUT: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  PATCH: 'bg-purple-500/15 text-purple-600 border-purple-500/30',
  DELETE: 'bg-rose-500/15 text-rose-600 border-rose-500/30',
  HEAD: 'bg-slate-500/15 text-slate-600 border-slate-500/30',
  OPTIONS: 'bg-cyan-500/15 text-cyan-600 border-cyan-500/30',
} as const

/** API 状态选项 */
export const API_STATUSES = ['DRAFT', 'PUBLISHED', 'DEPRECATED', 'DELETED'] as const

/** API 状态显示文案 */
export const statusLabels = {
  DRAFT: '开发中',
  PUBLISHED: '已发布',
  DEPRECATED: '已废弃',
  DELETED: '已删除',
} as const

/** API 状态对应的样式 */
export const statusColors = {
  DRAFT: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  PUBLISHED: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  DEPRECATED: 'bg-slate-500/15 text-slate-600 border-slate-500/30',
  DELETED: 'bg-rose-500/15 text-rose-600 border-rose-500/30',
} as const

/** 参数类型选项 */
export const PARAM_TYPES = ['string', 'number', 'integer', 'boolean', 'array', 'object'] as const

/** form-data 参数类型选项 */
export const FORM_DATA_TYPES = [...PARAM_TYPES, 'file'] as const

/** 参数类型显示文案 */
export const paramTypeLabels = {
  string: 'string',
  number: 'number',
  integer: 'integer',
  boolean: 'boolean',
  array: 'array',
  object: 'object',
  file: 'file',
} as const

/** 参数类型颜色 */
export const paramTypeColors = {
  string: 'text-emerald-600',
  number: 'text-blue-600',
  integer: 'text-blue-600',
  boolean: 'text-purple-600',
  array: 'text-amber-600',
  object: 'text-rose-600',
  file: 'text-cyan-600',
} as const

/** 请求体类型选项 */
export const REQUEST_BODY_TYPES = ['none', 'json', 'form-data', 'x-www-form-urlencoded', 'binary', 'raw'] as const

/** 请求体类型显示文案 */
export const requestBodyTypeLabels = {
  'none': '无',
  'json': 'JSON',
  'form-data': 'form-data',
  'x-www-form-urlencoded': 'x-www-form-urlencoded',
  'binary': 'binary',
  'raw': 'raw',
} as const

/** HTTP 状态码选项 */
export const HTTP_STATUS_CODES = [200, 201, 204, 301, 302, 304, 400, 401, 403, 404, 422, 500, 502, 503] as const

/** HTTP 状态码常用分类 */
export const HTTP_STATUS_CATEGORIES = {
  success: [200, 201, 204],
  redirect: [301, 302, 304],
  clientError: [400, 401, 403, 404, 422],
  serverError: [500, 502, 503],
} as const

/** HTTP 状态码描述 */
export const httpStatusLabels = {
  200: 'OK',
  201: 'Created',
  204: 'No Content',
  301: 'Moved Permanently',
  302: 'Found',
  304: 'Not Modified',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  422: 'Unprocessable Entity',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
} as const

/** 常用请求头参数名 */
export const HEADER_PARAMS = [
  'Accept',
  'Accept-Charset',
  'Accept-Encoding',
  'Accept-Language',
  'Access-Control-Request-Headers',
  'Access-Control-Request-Method',
  'Authorization',
  'Cache-Control',
  'Connection',
  'Content-Length',
  'Content-Type',
  'Cookie',
  'Date',
  'Host',
  'If-Match',
  'If-Modified-Since',
  'If-None-Match',
  'If-Unmodified-Since',
  'Origin',
  'Pragma',
  'Range',
  'Referer',
  'User-Agent',
  'X-Requested-With',
  'X-Forwarded-For',
  'X-API-Key',
] as const

/** 请求体类型名称映射 */
export const BODY_NAME_MAP: Record<RequestBodyType, string> = {
  'json': 'application/json',
  'form-data': 'multipart/form-data',
  'x-www-form-urlencoded': 'application/x-www-form-urlencoded',
  'binary': 'application/octet-stream',
  'raw': 'text/plain',
  'none': '',
} as const

/** 响应类型样式 */
export const resStatusStyles = {
  'success': 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  'redirect': 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  'client-error': 'bg-rose-500/15 text-rose-600 border-rose-500/30',
  'server-error': 'bg-red-500/15 text-red-600 border-red-500/30',
}
