import { IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator'

/** 创建团队请求 DTO */
export class CreateTeamDto {
  /** 团队名称 */
  @IsNotEmpty({ message: '团队名称不能为空' })
  @IsString({ message: '团队名称必须是字符串' })
  @MinLength(2, { message: '团队名称长度不能少于 2 个字符' })
  @MaxLength(50, { message: '团队名称长度不能超过 50 个字符' })
  name: string

  /** 团队标识符（URL 友好） */
  @IsNotEmpty({ message: '团队标识符不能为空' })
  @IsString({ message: '团队标识符必须是字符串' })
  @MinLength(2, { message: '团队标识符长度不能少于 2 个字符' })
  @MaxLength(30, { message: '团队标识符长度不能超过 30 个字符' })
  slug: string

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

/** 创建团队响应 DTO */
export class CreateTeamResponseDto {
  /** 响应消息 */
  message: string

  /** 创建的团队信息 */
  team: {
    id: string
    name: string
    slug: string
    description?: string
    avatar?: string
    createdAt: Date
  }
}
