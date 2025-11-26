import { IsEmail, IsOptional, IsString } from 'class-validator'

/**
 * 通用发邮件请求体。
 */
export class SendEmailDto {
  /**
   * 收件人邮箱。
   *
   * 如需多收件人，可以在上层封装时自行扩展为数组。
   */
  @IsEmail()
  to: string

  /**
   * 邮件主题。
   */
  @IsString()
  subject: string

  /**
   * 纯文本内容。
   */
  @IsOptional()
  @IsString()
  text?: string

  /**
   * HTML 内容。
   */
  @IsOptional()
  @IsString()
  html?: string
}
