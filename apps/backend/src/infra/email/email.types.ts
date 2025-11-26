export type MailProvider = 'resend'

/**
 * 统一的邮件发送入参结构
 */
export interface SendMailInput {
  /**
   * 收件人邮箱，支持单个或多个
   */
  readonly to: string | string[]

  /**
   * 发件人邮箱（可选）
   *
   * 若不传，使用全局默认发件人配置
   */
  readonly from?: string

  /**
   * 邮件主题
   */
  readonly subject: string

  /**
   * 纯文本内容（可选）
   */
  readonly text?: string

  /**
   * HTML 内容（可选）
   */
  readonly html?: string
}

/**
 * 统一的邮件发送结果结构
 */
export interface SendMailResult {
  /**
   * 邮件提供商返回的 ID（如果有）
   */
  readonly id?: string

  /**
   * 实际使用的发送通道
   */
  readonly provider: MailProvider
}

/**
 * 邮件发送服务
 *
 * 任意邮件服务实现只需继承本抽象类，并在对应模块中注册为 Provider，
 * 即可被业务层按 provider 进行选择性调用
 */
export abstract class AbstractMailService {
  /**
   * 邮件提供商标识，如：
   * - 'resend'
   * - 未来可以扩展为 'ses' | 'smtp' 等
   */
  abstract readonly provider: MailProvider

  /**
   * 发送邮件
   */
  abstract sendMail(input: SendMailInput): Promise<SendMailResult>
}
