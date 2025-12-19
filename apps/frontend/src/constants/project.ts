/** 环境类型选项 */
export const ENV_TYPE_OPTIONS = [
  { value: 'DEV', label: '开发环境' },
  { value: 'TEST', label: '测试环境' },
  { value: 'STAGING', label: '预发布环境' },
  { value: 'PROD', label: '生产环境' },
] as const

/** 环境类型显示名称映射 */
export const ENV_TYPE_LABEL_MAP = {
  DEV: '开发',
  TEST: '测试',
  STAGING: '预发布',
  PROD: '生产',
} as const
