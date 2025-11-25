import { Exclude, Expose, Transform, Type } from 'class-transformer'
import { ApiBriefDto } from '../api.dto'

@Exclude()
export class GroupBriefDto {
  @Expose()
  id: string

  @Expose()
  name: string

  @Expose()
  @Transform(({ value }) => (value !== null ? value : undefined), { toPlainOnly: true })
  parentId?: string

  @Expose()
  @Transform(({ value }) => (value !== null ? value : undefined), { toPlainOnly: true })
  description?: string

  @Expose()
  sortOrder: number

  @Expose()
  createdAt: Date

  @Expose()
  updatedAt: Date
}

@Exclude()
export class GroupNodeDto {
  @Expose()
  id: string

  @Expose()
  name: string

  @Expose()
  sortOrder: number

  @Expose()
  @Type(() => GroupNodeDto)
  children: GroupNodeDto[]

  @Expose()
  @Transform(({ value }) => (value !== undefined ? value : 0), { toPlainOnly: true })
  apiCount: number
}

@Exclude()
export class GroupNodeWithAPIDto extends GroupNodeDto {
  @Expose()
  @Type(() => ApiBriefDto)
  apis: ApiBriefDto[]
}
