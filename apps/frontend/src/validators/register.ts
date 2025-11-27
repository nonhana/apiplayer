import { toTypedSchema } from '@vee-validate/zod'
import z from 'zod'

/**
 * 注册表单校验规则
 */
export const registerFormSchema = toTypedSchema(z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  username: z.string()
    .min(3, '用户名需至少 3 个字符')
    .max(20, '用户名不能超过 20 个字符')
    .regex(/^[\w-]+$/, '用户名仅支持字母、数字、下划线或中划线'),
  name: z.string().min(1, '请输入姓名').max(50, '姓名不能超过 50 个字符'),
  password: z.string()
    .min(8, '密码至少需 8 位字符')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '密码需同时包含大小写字母与数字'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
}))
