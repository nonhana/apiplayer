import { Exclude, Expose, Type } from 'class-transformer'

import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

/** 基本分页查询 DTO */
export class BasePaginatedQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '页码必须是整数' })
  @Min(1, { message: '页码最小为 1' })
  page?: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '每页数量必须是整数' })
  @Min(1, { message: '每页数量最小为 1' })
  @Max(100, { message: '每页数量最大为 100' })
  limit?: number = 10

  @IsOptional()
  @IsString({ message: '搜索关键词必须是字符串' })
  search?: string
}

/** 分页信息 DTO */
@Exclude()
export class PaginationDto {
  @Expose()
  page: number

  @Expose()
  limit: number

  @Expose()
  totalPages: number

  @Expose()
  hasNext: boolean

  @Expose()
  hasPrev: boolean
}
