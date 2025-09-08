import { Exclude, Expose, Type } from 'class-transformer'
import { PaginationDto } from '@/common/dto/pagination.dto'
import { GlobalParamDto } from './global-param.dto'

@Exclude()
export class GlobalParamsDto {
  @Expose()
  @Type(() => GlobalParamDto)
  params: GlobalParamDto[]

  @Expose()
  total: number

  @Expose()
  @Type(() => PaginationDto)
  pagination: PaginationDto
}
