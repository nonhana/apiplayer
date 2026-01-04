import type { VersionChangeType, VersionStatus } from '@/types/version'

/** 版本状态选项 */
export const VERSION_STATUSES: readonly VersionStatus[] = ['DRAFT', 'CURRENT', 'ARCHIVED'] as const

/** 版本状态显示文案 */
export const versionStatusLabels: Record<VersionStatus, string> = {
  DRAFT: '草稿',
  CURRENT: '当前版本',
  ARCHIVED: '已归档',
}

/** 版本状态对应的样式 */
export const versionStatusColors: Record<VersionStatus, string> = {
  DRAFT: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  CURRENT: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  ARCHIVED: 'bg-slate-500/15 text-slate-600 border-slate-500/30',
}

/** 版本状态图标颜色 */
export const versionStatusDotColors: Record<VersionStatus, string> = {
  DRAFT: 'bg-amber-500',
  CURRENT: 'bg-emerald-500',
  ARCHIVED: 'bg-slate-400',
}

/** 版本变更类型显示文案 */
export const versionChangeTypeLabels: Record<VersionChangeType, string> = {
  BASIC_INFO: '基本信息',
  REQUEST_PARAM: '请求参数',
  REQUEST_BODY: '请求体',
  RESPONSE: '响应定义',
  CREATE: '新增接口',
  DELETE: '删除接口',
  RESTORE: '版本恢复',
}

/** 版本变更类型对应的样式 */
export const versionChangeTypeColors: Record<VersionChangeType, string> = {
  BASIC_INFO: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  REQUEST_PARAM: 'bg-purple-500/15 text-purple-600 border-purple-500/30',
  REQUEST_BODY: 'bg-cyan-500/15 text-cyan-600 border-cyan-500/30',
  RESPONSE: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  CREATE: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  DELETE: 'bg-rose-500/15 text-rose-600 border-rose-500/30',
  RESTORE: 'bg-orange-500/15 text-orange-600 border-orange-500/30',
}

/** 版本差异字段标签 */
export const versionDiffFieldLabels: Record<string, string> = {
  name: '名称',
  method: '请求方法',
  path: '路径',
  description: '描述',
  tags: '标签',
  status: '状态',
  sortOrder: '排序',
  pathParams: '路径参数',
  queryParams: '查询参数',
  requestHeaders: '请求头',
  requestBody: '请求体',
  responses: '响应定义',
  mockConfig: 'Mock配置',
  examples: '示例数据',
}
