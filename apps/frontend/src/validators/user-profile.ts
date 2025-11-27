import { toTypedSchema } from '@vee-validate/zod'
import z from 'zod'

/**
 * 用户资料表单校验规则
 */
export const userProfileFormSchema = toTypedSchema(z.object({
  name: z.string()
    .min(1, '显示名称不能为空')
    .max(50, '显示名称长度不能超过 50 个字符'),
  username: z.string()
    .min(3, '用户名至少 3 个字符')
    .max(20, '用户名不能超过 20 个字符')
    .regex(/^[\w-]+$/, '用户名仅限字母、数字、下划线或中划线'),
  avatar: z.string()
    .url('请输入有效的头像链接')
    .optional()
    .or(z.literal('')),
  bio: z.string()
    .max(200, '个人简介不能超过 200 字')
    .optional()
    .or(z.literal('')),
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
  verificationCode: z.string()
    .length(6, '验证码需为 6 位数字')
    .optional()
    .or(z.literal('')),
}).refine((data) => {
  if (!data.newPassword || data.newPassword === '')
    return true
  return data.newPassword === data.confirmNewPassword
}, {
  message: '两次输入的新密码不一致',
  path: ['confirmNewPassword'],
}))
