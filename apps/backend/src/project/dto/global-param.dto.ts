import type { ParamType, RequestParamCategory } from '@/constants/global-param'
import { Exclude, Expose, Transform } from 'class-transformer'

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
  value: any

  @Expose()
  @Transform(({ value }) => (value !== null ? value : undefined))
  description?: string

  @Expose()
  isActive: boolean

  @Expose()
  createdAt: Date

  @Expose()
  updatedAt: Date
}
