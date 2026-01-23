import { toTypedSchema } from '@vee-validate/zod'
import z from 'zod'

/**
 * 用户安全信息表单校验规则
 */
export const userSecurityFormSchema = toTypedSchema(
  z.object({
    newEmail: z.string()
      .email('请输入有效的邮箱地址')
      .optional()
      .or(z.literal('')),
    newPassword: z.string()
      .min(8, '新密码不能为空且不少于 8 位')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '新密码需包含大小写字母和数字')
      .optional()
      .or(z.literal('')),
    confirmNewPassword: z.string()
      .optional()
      .or(z.literal('')),
    verificationCode: z.string({ required_error: '请填写验证码' })
      .length(6, '验证码需为 6 位数字'),
  })
    .superRefine((data, ctx) => {
      const emptyEmail = !data.newEmail
      const emptyPassword = !data.newPassword

      if (emptyEmail && emptyPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '新邮箱和新密码不能同时为空',
          path: ['newEmail'],
        })
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '新邮箱和新密码不能同时为空',
          path: ['newPassword'],
        })
      }

      if (data.newPassword && data.newPassword !== data.confirmNewPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '两次输入的新密码不一致',
          path: ['confirmNewPassword'],
        })
      }
    }),
)
