import { toTypedSchema } from '@vee-validate/zod'
import z from 'zod'

export const systemConfigFormSchema = toTypedSchema(z.object({
  register_enabled: z.boolean({ required_error: '请选择是否允许用户注册' }),
  register_email_verify: z.boolean({ required_error: '请选择是否需要邮箱验证' }),
  team_max_members: z.number({ required_error: '请输入团队最大成员数量' })
    .min(1, '团队最大成员数量不能小于 1')
    .max(1000, '团队最大成员数量不能大于 1000'),
  invite_mode: z.enum(['direct', 'email'], { required_error: '请选择团队邀请模式' }),
  invite_expires_days: z.number({ required_error: '请输入邀请链接过期天数' })
    .min(1, '邀请链接过期天数不能小于 1')
    .max(30, '邀请链接过期天数不能大于 14'),
  project_max_apis: z.number({ required_error: '请输入单个项目最大 API 数量' })
    .min(1, '单个项目最大 API 数量不能小于 1')
    .max(10000, '单个项目最大 API 数量不能大于 10000'),
  api_max_versions: z.number({ required_error: '请输入单个 API 最大版本数量' })
    .min(1, '单个 API 最大版本数量不能小于 1')
    .max(100, '单个 API 最大版本数量不能大于 100'),
  api_version_auto_inc: z.boolean({ required_error: '请选择是否自动递增 API 版本号' }),
}))
