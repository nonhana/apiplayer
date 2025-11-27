import { toTypedSchema } from '@vee-validate/zod'
import z from 'zod'

/**
 * 登录表单校验规则
 */
export const loginFormSchema = toTypedSchema(z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少需要 6 位字符'),
  rememberMe: z.boolean().default(false),
}))
