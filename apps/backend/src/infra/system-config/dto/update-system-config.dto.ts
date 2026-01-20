import type { InputJsonValue } from 'prisma/generated/internal/prismaNamespace'
import { SystemConfigKey, TeamInviteMode } from '@apiplayer/shared'
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, Max, Min } from 'class-validator'
import { IsJsonValue } from '@/common/validator/is-json'

export class UpdateConfigReqDto {
  @IsNotEmpty({ message: '配置值不能为空' })
  @IsJsonValue({ message: '配置值必须是合法的 JSON 值' })
  value: InputJsonValue
}

export class UpdateConfigsReqDto {
  @IsOptional()
  @IsBoolean({ message: '启用状态必须是布尔值' })
  [SystemConfigKey.REGISTER_ENABLED]?: boolean

  @IsOptional()
  @IsBoolean({ message: '邮箱验证状态必须是布尔值' })
  [SystemConfigKey.REGISTER_EMAIL_VERIFY]?: boolean

  @IsOptional()
  @IsInt({ message: '团队最大成员数量必须是整数' })
  @Min(1, { message: '团队最大成员数量不能小于 1' })
  @Max(1000, { message: '团队最大成员数量不能大于 1000' })
  [SystemConfigKey.TEAM_MAX_MEMBERS]?: number

  @IsOptional()
  @IsEnum(TeamInviteMode, { message: '团队邀请模式必须是有效的枚举值' })
  [SystemConfigKey.INVITE_MODE]?: TeamInviteMode

  @IsOptional()
  @IsInt({ message: '邀请链接过期天数必须是整数' })
  @Min(1, { message: '邀请链接过期天数不能小于 1' })
  @Max(14, { message: '邀请链接过期天数不能大于 14' })
  [SystemConfigKey.INVITE_EXPIRES_DAYS]?: number

  @IsOptional()
  @IsInt({ message: '单个项目最大 API 数量必须是整数' })
  @Min(1, { message: '单个项目最大 API 数量不能小于 1' })
  @Max(10000, { message: '单个项目最大 API 数量不能大于 10000' })
  [SystemConfigKey.PROJECT_MAX_APIS]?: number

  @IsOptional()
  @IsInt({ message: '单个 API 最大修订记录数量必须是整数' })
  @Min(1, { message: '单个 API 最大修订记录数量不能小于 1' })
  @Max(100, { message: '单个 API 最大修订记录数量不能大于 100' })
  [SystemConfigKey.API_MAX_REVISIONS]?: number
}
