import { toTypedSchema } from '@vee-validate/zod'
import z from 'zod'

/**
 * 项目表单基础 schema（同时用于创建和编辑）
 * 包含所有字段，使用统一的校验规则
 */
export const projectFormSchema = toTypedSchema(z.object({
  name: z.string()
    .min(2, '项目名称长度不能少于 2 个字符')
    .max(50, '项目名称长度不能超过 50 个字符'),
  slug: z.string()
    .min(2, '项目标识符长度不能少于 2 个字符')
    .max(30, '项目标识符长度不能超过 30 个字符')
    .regex(/^[a-z0-9-]+$/, '项目标识符只能包含小写字母、数字和连字符'),
  description: z.string()
    .max(500, '项目描述长度不能超过 500 个字符')
    .optional()
    .or(z.literal('')),
  icon: z.string()
    .url('请输入有效的图标链接')
    .optional()
    .or(z.literal('')),
  isPublic: z.boolean().default(false),
}))

/** 项目表单值类型 */
export interface ProjectFormValues {
  name: string
  slug: string
  description: string
  icon: string
  isPublic: boolean
}
