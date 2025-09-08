import { IsBoolean, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator'
import { projectEnvType, ProjectEnvType } from '@/common/types/project-env'

export class CreateProjectEnvDto {
  /** 环境名称 */
  @IsNotEmpty({ message: '环境名称不能为空' })
  @IsString({ message: '环境名称必须是字符串' })
  @MinLength(2, { message: '环境名称长度不能少于 2 个字符' })
  @MaxLength(30, { message: '环境名称长度不能超过 30 个字符' })
  name: string

  /** 环境类型 */
  @IsNotEmpty({ message: '环境类型不能为空' })
  @IsEnum(projectEnvType, { message: '环境类型必须是有效的枚举值' })
  type: ProjectEnvType

  /** 基础 URL */
  @IsNotEmpty({ message: '基础 URL 不能为空' })
  @IsUrl({}, { message: '基础 URL 必须是有效的 URL' })
  baseUrl: string

  /** 环境变量 */
  @IsOptional()
  @IsObject({ message: '环境变量必须是对象格式' })
  variables?: Record<string, any>

  /** 请求头 */
  @IsOptional()
  @IsObject({ message: '请求头必须是对象格式' })
  headers?: Record<string, any>

  /** 是否为默认环境 */
  @IsOptional()
  @IsBoolean({ message: '默认环境标识必须是布尔值' })
  isDefault?: boolean
}
