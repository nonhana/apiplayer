import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'
import { APIMethod, APIStatus } from 'prisma/generated/client'

export class GetGroupWithAPIReqDto {
  @IsOptional()
  @IsString({ message: '分支根ID必须是字符串' })
  subtreeRootId?: string

  @IsOptional()
  @IsInt({ message: '最大深度必须是整数' })
  @Min(1, { message: '最大深度至少为 1' })
  @Max(32, { message: '最大深度不能超过 32' })
  maxDepth?: number

  @IsOptional()
  includeCurrentVersion?: boolean

  @IsOptional()
  @IsEnum(APIMethod, { message: '方法必须是有效的枚举值' })
  apiMethod?: APIMethod

  @IsOptional()
  @IsEnum(APIStatus, { message: '状态必须是有效的枚举值' })
  apiStatus?: APIStatus

  @IsOptional()
  @IsString({ message: '搜索关键词必须是字符串' })
  search?: string

  @IsOptional()
  @IsInt({ message: '每组 API 限制数量必须是整数' })
  @Min(1, { message: '每组 API 限制数量至少为 1' })
  @Max(1000, { message: '每组 API 限制数量不能超过 1000' })
  apiLimitPerGroup?: number

  @IsOptional()
  @IsString({ message: '排序参数必须是字符串' })
  sort?: 'groups' | 'apis'
}
