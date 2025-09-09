/** 参数数据类型枚举 */
export const paramType = ['STRING', 'NUMBER', 'INTEGER', 'BOOLEAN', 'ARRAY', 'OBJECT', 'FILE'] as const

export type ParamType = (typeof paramType)[number]

/** 请求参数类型枚举 */
export const requestParamCategory = ['PATH', 'QUERY', 'HEADER', 'COOKIE', 'FORM_DATA', 'FORM_URL_ENCODED', 'BODY_JSON', 'BODY_XML', 'BODY_RAW'] as const

export type RequestParamCategory = (typeof requestParamCategory)[number]
