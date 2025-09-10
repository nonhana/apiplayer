/** 参数数据类型枚举 */
export const PARAM_TYPE = ['STRING', 'NUMBER', 'INTEGER', 'BOOLEAN', 'ARRAY', 'OBJECT', 'FILE'] as const

export type ParamType = (typeof PARAM_TYPE)[number]

/** 请求参数类型枚举 */
export const PARAM_CATEGORY = ['PATH', 'QUERY', 'HEADER', 'COOKIE', 'FORM_DATA', 'FORM_URL_ENCODED', 'BODY_JSON', 'BODY_XML', 'BODY_RAW'] as const

export type ParamCategory = (typeof PARAM_CATEGORY)[number]
