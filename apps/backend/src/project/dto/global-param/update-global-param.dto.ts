import type { InputJsonValue } from 'prisma/generated/internal/prismaNamespace'
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator'
import { ParamType } from 'prisma/generated/client'
import { IsJsonValue } from '@/common/validator/is-json'

export class UpdateGlobalParamReqDto {
  /** 参数类型 */
  @IsOptional()
  @IsEnum(ParamType, { message: '参数类型必须是有效的枚举值' })
  type?: ParamType

  /** 参数值 */
  @IsOptional()
  @IsJsonValue({ message: '参数值必须是合法的 JSON 值' })
  value?: InputJsonValue

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
