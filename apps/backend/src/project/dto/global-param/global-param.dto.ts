import { ParamType, RequestParamCategory } from '@prisma/client'
import { JsonValue } from '@prisma/client/runtime/library'
import { Exclude, Expose, Transform, Type } from 'class-transformer'
import { PaginationDto } from '@/common/dto/pagination.dto'

@Exclude()
export class GlobalParamDto {
  @Expose()
  id: string

  @Expose()
  category: RequestParamCategory

  @Expose()
  name: string

  @Expose()
  type: ParamType

  @Expose()
  value: JsonValue

  @Expose()
  @Transform(({ value }) => (value !== null ? value : undefined), { toPlainOnly: true })
  description?: string

  @Expose()
  isActive: boolean

  @Expose()
  createdAt: Date

  @Expose()
  updatedAt: Date
}

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
