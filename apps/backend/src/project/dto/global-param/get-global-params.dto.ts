import { IsBoolean, IsEnum, IsOptional } from 'class-validator'
import { BasePaginatedQueryDto } from '@/common/dto/pagination.dto'
import { PARAM_CATEGORY, PARAM_TYPE, type ParamCategory, type ParamType } from '@/constants/global-param'

/** 全局参数查询 DTO */
export class GetGlobalParamsReqDto extends BasePaginatedQueryDto {
  /** 参数类别过滤 */
  @IsOptional()
  @IsEnum(PARAM_CATEGORY, { message: '参数类别必须是有效的枚举值' })
  category?: ParamCategory

  /** 参数类型过滤 */
  @IsOptional()
  @IsEnum(PARAM_TYPE, { message: '参数类型必须是有效的枚举值' })
  type?: ParamType

  /** 是否只显示启用的参数 */
  @IsOptional()
  @IsBoolean({ message: '启用状态必须是布尔值' })
  isActive?: boolean
}
