import { Exclude, Expose, Transform, Type } from 'class-transformer'
import { PaginationDto } from '@/common/dto/pagination.dto'
import { UserBriefInfoDto } from '@/common/dto/user.dto'

@Exclude()
export class ApiBriefDto {
  @Expose()
  id: string

  @Expose()
  name: string

  @Expose()
  method: string

  @Expose()
  path: string

  @Expose()
  sortOrder: number
}

@Exclude()
export class ApiDetailDto extends ApiBriefDto {
  @Expose()
  tags: string[]

  @Expose()
  @Type(() => UserBriefInfoDto)
  owner: UserBriefInfoDto

  @Expose()
  @Type(() => UserBriefInfoDto)
  editor: UserBriefInfoDto

  @Expose()
  @Type(() => UserBriefInfoDto)
  creator: UserBriefInfoDto

  @Expose()
  createdAt: Date

  @Expose()
  updatedAt: Date

  @Expose()
  @Transform(({ obj }) => {
    const description = obj.currentVersion?.snapshot?.description
    return description !== null ? description : undefined
  }, { toClassOnly: true })
  description?: string

  @Expose()
  @Transform(({ obj }) => obj.currentVersion?.snapshot?.status, {
    toClassOnly: true,
  })
  status: string

  @Expose()
  @Transform(({ obj }) => obj.currentVersion?.snapshot?.requestHeaders, {
    toClassOnly: true,
  })
  requestHeaders: Record<string, any>[]

  @Expose()
  @Transform(({ obj }) => obj.currentVersion?.snapshot?.pathParams, {
    toClassOnly: true,
  })
  pathParams: Record<string, any>[]

  @Expose()
  @Transform(({ obj }) => obj.currentVersion?.snapshot?.queryParams, {
    toClassOnly: true,
  })
  queryParams: Record<string, any>[]

  @Expose()
  @Transform(({ obj }) => obj.currentVersion?.snapshot?.requestBody, {
    toClassOnly: true,
  })
  requestBody?: Record<string, any>

  @Expose()
  @Transform(({ obj }) => obj.currentVersion?.snapshot?.responses, {
    toClassOnly: true,
  })
  responses: Record<string, any>[]

  @Expose()
  @Transform(({ obj }) => obj.currentVersion?.snapshot?.examples, {
    toClassOnly: true,
  })
  examples: Record<string, any>

  @Expose()
  @Transform(({ obj }) => obj.currentVersion?.snapshot?.mockConfig, {
    toClassOnly: true,
  })
  mockConfig?: Record<string, any>
}

@Exclude()
export class ApisDto {
  @Expose()
  @Type(() => ApiBriefDto)
  apis: ApiBriefDto[]

  @Expose()
  total: number

  @Expose()
  @Type(() => PaginationDto)
  pagination: PaginationDto
}
