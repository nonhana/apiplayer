import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** tw 合并类名的方法 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** 获取兜底 Project Icon */
export function getProjectFallbackIcon(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return (name.charAt(0) ?? 'P').toUpperCase()
  }
  return ((parts[0]?.charAt(0) ?? '') + (parts[1]?.charAt(0) ?? '')).toUpperCase() || 'P'
}

/** 获取兜底 Team Icon */
export function getTeamFallbackIcon(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return (parts[0]?.charAt(0) ?? 'T').toUpperCase()
  }
  return ((parts[0]?.charAt(0) ?? '') + (parts[1]?.charAt(0) ?? '')).toUpperCase() || 'T'
}

/** 获取兜底 User Icon */
export function getUserFallbackIcon(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1)
    return (parts[0]?.charAt(0) ?? 'U').toUpperCase()
  return ((parts[0]?.charAt(0) ?? '') + (parts[1]?.charAt(0) ?? '')).toUpperCase() || 'U'
}

/**
 * 从 API 路径中提取路径参数名
 * 支持 {paramName} 和 :paramName 两种格式
 * @example
 * extractPathParamNames('/users/{id}/posts/{postId}') // ['id', 'postId']
 * extractPathParamNames('/users/:id/posts/:postId') // ['id', 'postId']
 */
export function extractPathParamNames(path: string): string[] {
  const params: string[] = []

  // 匹配 {paramName} 格式
  const bracketMatches = path.matchAll(/\{([^}]+)\}/g)
  for (const match of bracketMatches) {
    if (match[1] && !params.includes(match[1])) {
      params.push(match[1])
    }
  }

  // 匹配 :paramName 格式
  const colonMatches = path.matchAll(/:([a-z_]\w*)/gi)
  for (const match of colonMatches) {
    if (match[1] && !params.includes(match[1])) {
      params.push(match[1])
    }
  }

  return params
}

/** 构建选项列表 */
export function buildOptionList(arr: string[]) {
  return arr.map(item => ({
    label: item,
    value: item,
  }))
}
