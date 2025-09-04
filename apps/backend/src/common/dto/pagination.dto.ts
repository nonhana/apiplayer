import { Exclude, Expose } from 'class-transformer'

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
