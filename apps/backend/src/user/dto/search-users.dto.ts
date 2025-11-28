import { Exclude, Expose, Transform, Type } from 'class-transformer'
import { BasePaginatedQueryDto, PaginationDto } from '@/common/dto/pagination.dto'

/** 搜索用户请求 DTO */
export class SearchUsersReqDto extends BasePaginatedQueryDto {}

/** 用户列表项 DTO */
@Exclude()
export class UserItemDto {
  @Expose()
  id: string

  @Expose()
  email: string

  @Expose()
  username: string

  @Expose()
  name: string

  @Expose()
  @Transform(({ value }) => (value !== null ? value : undefined), { toPlainOnly: true })
  avatar?: string

  @Expose()
  @Transform(({ value }) => (value !== null ? value : undefined), { toPlainOnly: true })
  bio?: string

  @Expose()
  isActive: boolean

  @Expose()
  createdAt: Date
}

/** 用户搜索结果 DTO */
@Exclude()
export class SearchUsersResDto {
  @Expose()
  @Type(() => UserItemDto)
  users: UserItemDto[]

  @Expose()
  total: number

  @Expose()
  @Type(() => PaginationDto)
  pagination: PaginationDto
}
