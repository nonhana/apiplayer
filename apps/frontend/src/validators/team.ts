import { toTypedSchema } from '@vee-validate/zod'
import z from 'zod'

/**
 * 创建团队表单校验规则
 */
export const createTeamFormSchema = toTypedSchema(z.object({
  name: z.string()
    .min(2, '团队名称长度不能少于 2 个字符')
    .max(50, '团队名称长度不能超过 50 个字符'),
  slug: z.string()
    .min(2, '团队标识符长度不能少于 2 个字符')
    .max(30, '团队标识符长度不能超过 30 个字符')
    .regex(/^[a-z0-9-]+$/, '团队标识符只能包含小写字母、数字和连字符'),
  description: z.string()
    .max(500, '团队描述长度不能超过 500 个字符')
    .optional()
    .or(z.literal('')),
  avatar: z.string()
    .url('请输入有效的头像链接')
    .optional()
    .or(z.literal('')),
}))

/**
 * 更新团队表单校验规则
 */
export const updateTeamFormSchema = toTypedSchema(z.object({
  name: z.string()
    .min(2, '团队名称长度不能少于 2 个字符')
    .max(50, '团队名称长度不能超过 50 个字符')
    .optional(),
  description: z.string()
    .max(500, '团队描述长度不能超过 500 个字符')
    .optional()
    .or(z.literal('')),
  avatar: z.string()
    .url('请输入有效的头像链接')
    .optional()
    .or(z.literal('')),
}))
