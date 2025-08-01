export enum ErrorCode {
  /** 用户不存在 */
  USER_NOT_FOUND = 10001,
  /** 用户已存在 */
  USER_ALREADY_EXISTS = 10002,
  /** 密码错误 */
  INVALID_PASSWORD = 10003,
  /** 邮箱格式不正确 */
  INVALID_EMAIL = 10004,
  /** 邮箱已被注册 */
  EMAIL_ALREADY_REGISTERED = 10005,
  /** 用户名格式不正确 */
  INVALID_USERNAME = 10006,
  /** 用户名已被占用 */
  USERNAME_ALREADY_EXISTS = 10007,
  /** 账号被禁用 */
  ACCOUNT_DISABLED = 10008,
  /** 账号被锁定 */
  ACCOUNT_LOCKED = 10009,
  /** 验证码错误或已过期 */
  INVALID_VERIFICATION_CODE = 10010,
}
