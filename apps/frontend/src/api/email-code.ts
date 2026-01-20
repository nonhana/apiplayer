import http from '@/service'

export const emailCodeApi = {
  /** 发送邮箱验证码 */
  sendEmailCode: (email: string) =>
    http.post('email-code/send', { json: { email } }).json<void>(),
} as const
