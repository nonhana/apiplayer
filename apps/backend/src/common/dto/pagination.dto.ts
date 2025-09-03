import { Exclude, Expose } from 'class-transformer'

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
