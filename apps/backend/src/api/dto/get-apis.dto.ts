import { APIMethod, APIStatus } from '@prisma/client'
import { IsEnum, IsOptional, IsString } from 'class-validator'
import { BasePaginatedQueryDto } from '@/common/dto/pagination.dto'

/** 获取 API 列表请求 DTO */
export class GetApisReqDto extends BasePaginatedQueryDto {
  /** 分组ID */
  @IsOptional()
  @IsString({ message: '分组ID必须是字符串' })
  groupId?: string

  /** 接口方法类型 */
  @IsOptional()
  @IsEnum(APIMethod, { message: '方法必须是有效的枚举值' })
  method?: APIMethod

  /** 接口状态 */
  @IsOptional()
  @IsEnum(APIStatus, { message: '状态必须是有效的枚举值' })
  status?: APIStatus
}
