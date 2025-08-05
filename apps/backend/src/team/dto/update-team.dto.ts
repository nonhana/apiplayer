import { IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator'

/** 更新团队请求 DTO */
export class UpdateTeamDto {
  /** 团队名称 */
  @IsOptional()
  @IsString({ message: '团队名称必须是字符串' })
  @MinLength(2, { message: '团队名称长度不能少于 2 个字符' })
  @MaxLength(50, { message: '团队名称长度不能超过 50 个字符' })
  name?: string

  /** 团队描述 */
  @IsOptional()
  @IsString({ message: '团队描述必须是字符串' })
  @MaxLength(500, { message: '团队描述长度不能超过 500 个字符' })
  description?: string

  /** 团队头像 */
  @IsOptional()
  @IsUrl({}, { message: '团队头像必须是有效的 URL' })
  avatar?: string
}

/** 更新团队响应 DTO */
export class UpdateTeamResponseDto {
  /** 响应消息 */
  message: string

  /** 更新后的团队信息 */
  team: {
    id: string
    name: string
    slug: string
    description?: string
    avatar?: string
    updatedAt: Date
  }
}
