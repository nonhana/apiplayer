import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator'
import { PARAM_TYPE, type ParamType } from '@/constants/global-param'

export class UpdateGlobalParamReqDto {
  /** 参数类型 */
  @IsOptional()
  @IsEnum(PARAM_TYPE, { message: '参数类型必须是有效的枚举值' })
  type?: ParamType

  /** 参数值 */
  @IsOptional()
  value?: any

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
