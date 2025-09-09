import type { ParamType, RequestParamCategory } from '@/constants/global-param'
import { IsBoolean, IsEnum, IsOptional } from 'class-validator'
import { BasePaginatedQueryDto } from '@/common/dto/pagination.dto'
import { paramType, requestParamCategory } from '@/constants/global-param'

/** 全局参数查询 DTO */
export class GetGlobalParamsReqDto extends BasePaginatedQueryDto {
  /** 参数类别过滤 */
  @IsOptional()
  @IsEnum(requestParamCategory, { message: '参数类别必须是有效的枚举值' })
  category?: RequestParamCategory

  /** 参数类型过滤 */
  @IsOptional()
  @IsEnum(paramType, { message: '参数类型必须是有效的枚举值' })
  type?: ParamType

  /** 是否只显示启用的参数 */
  @IsOptional()
  @IsBoolean({ message: '启用状态必须是布尔值' })
  isActive?: boolean
}
