import { toTypedSchema } from '@vee-validate/zod'
import z from 'zod'

/**
 * 用户基本信息表单校验规则
 */
export const userProfileFormSchema = toTypedSchema(z.object({
  name: z.string({ required_error: '请填写显示名称' })
    .min(1, '显示名称不能为空')
    .max(50, '显示名称长度不能超过 50 个字符'),
  username: z.string({ required_error: '请填写用户名' })
    .min(3, '用户名至少 3 个字符')
    .max(20, '用户名不能超过 20 个字符')
    .regex(/^[\w-]+$/, '用户名仅限字母、数字、下划线或中划线'),
  avatar: z.string()
    .url('请输入有效的头像链接')
    .optional(),
  bio: z.string()
    .max(200, '个人简介不能超过 200 字')
    .optional(),
}))
