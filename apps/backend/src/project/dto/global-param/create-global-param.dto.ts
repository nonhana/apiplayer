import type { ParamType, RequestParamCategory } from '@/constants/global-param'
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { paramType, requestParamCategory } from '@/constants/global-param'

/** 创建全局参数请求 DTO */
export class CreateGlobalParamReqDto {
  /** 参数类别 */
  @IsNotEmpty({ message: '参数类别不能为空' })
  @IsEnum(requestParamCategory, { message: '参数类别必须是有效的枚举值' })
  category: RequestParamCategory

  /** 参数名称 */
  @IsNotEmpty({ message: '参数名称不能为空' })
  @IsString({ message: '参数名称必须是字符串' })
  @MinLength(1, { message: '参数名称长度不能少于 1 个字符' })
  @MaxLength(100, { message: '参数名称长度不能超过 100 个字符' })
  name: string

  /** 参数类型 */
  @IsNotEmpty({ message: '参数类型不能为空' })
  @IsEnum(paramType, { message: '参数类型必须是有效的枚举值' })
  type: ParamType

  /** 参数值 */
  @IsNotEmpty({ message: '参数值不能为空' })
  value: any

  /** 参数描述 */
  @IsOptional()
  @IsString({ message: '参数描述必须是字符串' })
  @MaxLength(500, { message: '参数描述长度不能超过 500 个字符' })
  description?: string

  /** 是否启用 */
  @IsOptional()
  @IsBoolean({ message: '启用状态必须是布尔值' })
  isActive?: boolean
}

export class CreateGlobalParamsReqDto {
  @IsNotEmpty({ message: '参数列表不能为空' })
  params: CreateGlobalParamReqDto[]
}
