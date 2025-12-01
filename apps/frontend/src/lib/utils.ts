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
