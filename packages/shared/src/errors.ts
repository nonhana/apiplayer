import { StatusCodes } from 'http-status-codes'

/** 错误项定义 */
export interface ErrorItem {
  code: number
  message: string
  status: StatusCodes
}

/** 具体业务错误定义 */
export const errors = {
  // 用户相关 10xxx
  USER_NOT_FOUND: { code: 10001, message: '用户不存在', status: StatusCodes.NOT_FOUND },
  USER_ALREADY_EXISTS: { code: 10002, message: '用户已存在', status: StatusCodes.CONFLICT },
  INVALID_PASSWORD: { code: 10003, message: '密码错误', status: StatusCodes.UNAUTHORIZED },
  INVALID_EMAIL: { code: 10004, message: '邮箱格式不正确', status: StatusCodes.BAD_REQUEST },
  EMAIL_ALREADY_REGISTERED: { code: 10005, message: '邮箱已被注册', status: StatusCodes.CONFLICT },
  INVALID_USERNAME: { code: 10006, message: '用户名格式不正确', status: StatusCodes.BAD_REQUEST },
  USERNAME_ALREADY_EXISTS: { code: 10007, message: '用户名已被占用', status: StatusCodes.CONFLICT },
  ACCOUNT_DISABLED: { code: 10008, message: '账号被禁用', status: StatusCodes.FORBIDDEN },
  ACCOUNT_LOCKED: { code: 10009, message: '账号被锁定', status: StatusCodes.FORBIDDEN },
  INVALID_VERIFICATION_CODE: { code: 10010, message: '验证码错误或已过期', status: StatusCodes.BAD_REQUEST },
  PASSWORD_MISMATCH: { code: 10011, message: '两次密码输入不一致', status: StatusCodes.BAD_REQUEST },
  SESSION_EXPIRED: { code: 10012, message: 'Session已过期或无效', status: StatusCodes.UNAUTHORIZED },
  SESSION_FORBIDDEN: { code: 10013, message: '无权限操作此Session', status: StatusCodes.FORBIDDEN },
  REGISTER_DISABLED: { code: 10014, message: '注册功能已关闭', status: StatusCodes.FORBIDDEN },

  // 权限相关 20xxx
  INSUFFICIENT_PERMISSIONS: { code: 20001, message: '权限不足', status: StatusCodes.FORBIDDEN },
  ROLE_NOT_FOUND: { code: 20002, message: '角色不存在', status: StatusCodes.NOT_FOUND },
  PERMISSION_NOT_FOUND: { code: 20003, message: '权限不存在', status: StatusCodes.NOT_FOUND },
  ROLE_NAME_EXISTS: { code: 20004, message: '角色名称已存在', status: StatusCodes.CONFLICT },
  PERMISSION_NAME_EXISTS: { code: 20005, message: '权限名称已存在', status: StatusCodes.CONFLICT },
  SYSTEM_ROLE_CANNOT_DELETE: { code: 20006, message: '系统角色不能删除', status: StatusCodes.FORBIDDEN },

  // 团队相关 30xxx
  TEAM_NOT_FOUND: { code: 30001, message: '团队不存在', status: StatusCodes.NOT_FOUND },
  TEAM_NAME_EXISTS: { code: 30002, message: '团队名称已存在', status: StatusCodes.CONFLICT },
  TEAM_SLUG_EXISTS: { code: 30003, message: '团队标识符已存在', status: StatusCodes.CONFLICT },
  NOT_TEAM_MEMBER: { code: 30004, message: '不是团队成员', status: StatusCodes.FORBIDDEN },
  TEAM_MEMBER_NOT_FOUND: { code: 30005, message: '团队成员不存在', status: StatusCodes.NOT_FOUND },
  USER_ALREADY_TEAM_MEMBER: { code: 30006, message: '用户已是团队成员', status: StatusCodes.CONFLICT },
  CANNOT_REMOVE_TEAM_OWNER: { code: 30007, message: '不能移除团队所有者', status: StatusCodes.FORBIDDEN },
  CANNOT_DELETE_TEAM_WITH_PROJECTS: { code: 30008, message: '不能删除有项目的团队', status: StatusCodes.CONFLICT },
  TEAM_DISABLED: { code: 30009, message: '团队已被禁用', status: StatusCodes.FORBIDDEN },
  CANNOT_MODIFY_OWNER_ROLE: { code: 30010, message: '不能修改团队所有者角色', status: StatusCodes.FORBIDDEN },
  TEAM_MEMBER_LIMIT_EXCEEDED: { code: 30011, message: '团队成员数量已达上限', status: StatusCodes.FORBIDDEN },
  INVITATION_NOT_FOUND: { code: 30012, message: '邀请链接无效或已被使用', status: StatusCodes.NOT_FOUND },
  INVITATION_EXPIRED: { code: 30013, message: '邀请链接已过期', status: StatusCodes.GONE },
  INVITATION_ALREADY_ACCEPTED: { code: 30014, message: '该邀请已被接受', status: StatusCodes.CONFLICT },
  INVITATION_CANCELLED: { code: 30015, message: '该邀请已被撤销', status: StatusCodes.GONE },
  INVITATION_EMAIL_MISMATCH: { code: 30016, message: '邀请邮箱不匹配', status: StatusCodes.FORBIDDEN },
  INVITATION_ALREADY_PENDING: { code: 30017, message: '该邮箱已有待处理的邀请', status: StatusCodes.CONFLICT },

  // 项目相关 40xxx
  PROJECT_NOT_FOUND: { code: 40001, message: '项目不存在', status: StatusCodes.NOT_FOUND },
  PROJECT_NAME_EXISTS: { code: 40002, message: '项目名称已存在', status: StatusCodes.CONFLICT },
  PROJECT_SLUG_EXISTS: { code: 40003, message: '项目标识符已存在', status: StatusCodes.CONFLICT },
  NOT_PROJECT_MEMBER: { code: 40004, message: '不是项目成员', status: StatusCodes.FORBIDDEN },
  PROJECT_MEMBER_NOT_FOUND: { code: 40005, message: '项目成员不存在', status: StatusCodes.NOT_FOUND },
  USER_ALREADY_PROJECT_MEMBER: { code: 40006, message: '用户已是项目成员', status: StatusCodes.CONFLICT },
  CANNOT_DELETE_PROJECT_WITH_APIS: { code: 40007, message: '不能删除包含 API 的项目', status: StatusCodes.CONFLICT },
  PROJECT_DELETED: { code: 40008, message: '项目已被删除', status: StatusCodes.GONE },
  CANNOT_REMOVE_LAST_ADMIN: { code: 40009, message: '不能移除项目的最后一个管理员', status: StatusCodes.FORBIDDEN },
  ENVIRONMENT_NAME_EXISTS: { code: 40010, message: '环境名称已存在', status: StatusCodes.CONFLICT },
  ENVIRONMENT_NOT_FOUND: { code: 40011, message: '环境不存在', status: StatusCodes.NOT_FOUND },
  CANNOT_DELETE_LAST_ENVIRONMENT: { code: 40012, message: '不能删除项目的最后一个环境', status: StatusCodes.FORBIDDEN },
  USER_NOT_TEAM_MEMBER: { code: 40013, message: '用户不是团队成员', status: StatusCodes.FORBIDDEN },
  GLOBAL_PARAM_NAME_EXISTS: { code: 40014, message: '全局参数名称已存在', status: StatusCodes.CONFLICT },
  GLOBAL_PARAM_NOT_FOUND: { code: 40015, message: '全局参数不存在', status: StatusCodes.NOT_FOUND },

  // API 相关 50xxx
  API_GROUP_NOT_FOUND: { code: 50001, message: 'API 分组不存在', status: StatusCodes.NOT_FOUND },
  API_NOT_FOUND: { code: 50002, message: 'API 不存在', status: StatusCodes.NOT_FOUND },
  API_VERSION_NOT_FOUND: { code: 50003, message: 'API 版本不存在', status: StatusCodes.NOT_FOUND },
  API_PATH_METHOD_CONFLICT: { code: 50004, message: '同一路径与方法的 API 已存在', status: StatusCodes.CONFLICT },
  API_VERSION_EXISTS: { code: 50005, message: '版本号已存在', status: StatusCodes.CONFLICT },

  // 代理相关 60xxx
  PROXY_REQUEST_TIMEOUT: { code: 60001, message: '请求超时', status: StatusCodes.BAD_REQUEST },
  PROXY_REQUEST_FAILED: { code: 60002, message: '请求失败', status: StatusCodes.BAD_REQUEST },
  PROXY_PROTOCOL_NOT_SUPPORTED: { code: 60003, message: '仅支持 HTTP/HTTPS 协议', status: StatusCodes.BAD_REQUEST },
  PROXY_INVALID_URL_FORMAT: { code: 60004, message: '无效的 URL 格式', status: StatusCodes.BAD_REQUEST },

  // 系统配置错误 70xxx
  CONFIG_NOT_FOUND: { code: 70001, message: '配置不存在', status: StatusCodes.NOT_FOUND },
  CONFIG_INVALID: { code: 70002, message: '配置值无效', status: StatusCodes.BAD_REQUEST },

  // 通用错误 90xxx
  INVALID_PARAMS: { code: 90001, message: '参数错误', status: StatusCodes.BAD_REQUEST },
  ENV_CONFIG_ERROR: { code: 90002, message: '环境变量配置错误', status: StatusCodes.INTERNAL_SERVER_ERROR },
  INTERNAL_SERVER_ERROR: { code: 99999, message: '系统内部错误', status: StatusCodes.INTERNAL_SERVER_ERROR },
} as const satisfies Record<string, ErrorItem>

/** 错误名称类型 */
export type ErrorName = keyof typeof errors

/** 错误码类型 */
export type ErrorCode = (typeof errors)[ErrorName]['code']

/** 错误码 -> 错误消息 Map */
export const errorMsg = Object.fromEntries(
  Object.entries(errors).map(([_, { code, message }]) => [code, message]),
)

/** 根据错误名获取完整错误信息 */
export const getError = <K extends ErrorName>(name: K): (typeof errors)[K] => errors[name]

/** 根据错误名获取错误码 */
export const getErrorCode = <K extends ErrorName>(name: K): (typeof errors)[K]['code'] => errors[name].code

/** 根据错误名获取错误信息 */
export const getErrorMsg = <K extends ErrorName>(name: K): (typeof errors)[K]['message'] => errors[name].message

/** 根据错误名获取 HTTP 状态码 */
export const getHttpStatus = <K extends ErrorName>(name: K): (typeof errors)[K]['status'] => errors[name].status
