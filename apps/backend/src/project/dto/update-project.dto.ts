import { IsBoolean, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator'

/** 更新项目请求 DTO */
export class UpdateProjectReqDto {
  /** 项目名称 */
  @IsOptional()
  @IsString({ message: '项目名称必须是字符串' })
  @MinLength(2, { message: '项目名称长度不能少于 2 个字符' })
  @MaxLength(50, { message: '项目名称长度不能超过 50 个字符' })
  name?: string

  /** 项目描述 */
  @IsOptional()
  @IsString({ message: '项目描述必须是字符串' })
  @MaxLength(500, { message: '项目描述长度不能超过 500 个字符' })
  description?: string

  /** 项目图标 */
  @IsOptional()
  @IsUrl({ require_tld: false }, { message: '项目图标必须是有效的 URL' })
  icon?: string

  /** 是否公开项目 */
  @IsOptional()
  @IsBoolean({ message: '公开状态必须是布尔值' })
  isPublic?: boolean
}
