import type { LocalSchemaNode } from '@/types/json-schema'
import { toTypedSchema } from '@vee-validate/zod'
import z from 'zod'
import { API_STATUSES, HTTP_METHODS, PARAM_TYPES, REQUEST_BODY_TYPES } from '@/constants/api'
import { SCHEMA_FIELD_TYPES } from '@/lib/json-schema'

/** 快速创建 API */
export const createApiSchema = z.object({
  name: z.string().min(1, '接口名称不能为空'),
  method: z.enum(HTTP_METHODS, { message: '请选择正确的请求方法' }),
  path: z.string().min(1, '接口路径不能为空'),
  groupId: z.string().min(1, '接口必须归属于某个分组'),
})

export const createApiFormSchema = toTypedSchema(createApiSchema)

/** 克隆 API */
export const cloneApiSchema = z.object({
  targetGroupId: z.string().min(1, '请选择目标分组'),
  name: z.string().min(1, '接口名称不能为空'),
  method: z.enum(HTTP_METHODS, { message: '请选择正确的请求方法' }),
  path: z.string().min(1, '接口路径不能为空'),
})

export const cloneApiFormSchema = toTypedSchema(cloneApiSchema)

export const basicInfoSchema = z.object({
  name: z.string().min(1, '接口名称不能为空'),
  method: z.enum(HTTP_METHODS, { message: '请选择正确的请求方法' }),
  path: z.string().min(1, '接口路径不能为空'),
  status: z.enum(API_STATUSES, { message: '请选择正确的接口状态' }),
  tags: z.array(z.string()),
  description: z.string().optional(),
  ownerId: z.string().optional(),
})

export const paramSchema = z.object({
  name: z.string().min(1, '参数名称不能为空'),
  type: z.enum(PARAM_TYPES, { message: '请选择正确的参数类型' }),
  description: z.string().optional(),
  required: z.boolean().optional(),
  default: z.string().optional(),
  example: z.string().optional(),
  enum: z.array(z.string()).optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  format: z.string().optional(),
})

export const paramsDataSchema = z.object({
  pathParams: z.array(paramSchema),
  queryParams: z.array(paramSchema),
  requestHeaders: z.array(paramSchema),
})

export const localSchemaSchema: z.ZodType<LocalSchemaNode> = z.lazy(() =>
  z.object({
    isRoot: z.boolean().optional(),
    isArrayItem: z.boolean().optional(),
    id: z.string().min(1, '字段标识不能为空'),
    name: z.string(),
    type: z.enum(SCHEMA_FIELD_TYPES, { message: '请选择正确的字段类型' }),
    required: z.boolean(),
    description: z.string(),
    example: z.string().optional(),
    children: z.array(localSchemaSchema).optional(),
    item: localSchemaSchema.optional(),
  }),
)

export const localReqBodySchema = z.object({
  type: z.enum(REQUEST_BODY_TYPES, { message: '请选择正确的请求体类型' }),
  jsonSchema: localSchemaSchema.optional(),
  formFields: z.array(paramSchema).optional(),
  rawContentType: z.string().optional(),
  example: z.any().optional(),
  description: z.string().optional(),
})

export const localResItemSchema = z.object({
  id: z.string().min(1, '响应标识不能为空'),
  name: z.string().min(1, '响应名称不能为空'),
  httpStatus: z
    .number()
    .int({ message: '状态码必须是整数' })
    .gte(100, '状态码不能低于 100')
    .lte(599, '状态码不能高于 599'),
  body: localSchemaSchema.optional(),
  description: z.string().optional(),
  headers: z.array(paramSchema).optional(),
  example: z.any().optional(),
})

export const localResListSchema = z.array(localResItemSchema)

/** API 编辑器数据验证 */
export const apiEditorDataSchema = z.object({
  basicInfo: basicInfoSchema,
  paramsData: paramsDataSchema,
  requestBody: localReqBodySchema.nullable(),
  responses: localResListSchema,
})
