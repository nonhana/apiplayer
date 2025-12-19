import { toTypedSchema } from '@vee-validate/zod'
import z from 'zod'

/** 环境类型枚举 */
const envTypeEnum = z.enum(['DEV', 'TEST', 'STAGING', 'PROD'], {
  errorMap: () => ({ message: '请选择有效的环境类型' }),
})

/**
 * 创建项目环境表单校验规则
 */
export const createProjectEnvFormSchema = toTypedSchema(z.object({
  name: z.string()
    .min(2, '环境名称长度不能少于 2 个字符')
    .max(30, '环境名称长度不能超过 30 个字符'),
  type: envTypeEnum,
  baseUrl: z.string()
    .url('请输入有效的 URL'),
  isDefault: z.boolean().default(false),
}))

/**
 * 更新项目环境表单校验规则
 */
export const updateProjectEnvFormSchema = toTypedSchema(z.object({
  name: z.string()
    .min(2, '环境名称长度不能少于 2 个字符')
    .max(30, '环境名称长度不能超过 30 个字符')
    .optional(),
  type: envTypeEnum.optional(),
  baseUrl: z.string()
    .url('请输入有效的 URL')
    .optional(),
  isDefault: z.boolean().optional(),
}))
