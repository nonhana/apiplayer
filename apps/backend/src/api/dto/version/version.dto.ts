import { Exclude, Expose, Transform, Type } from 'class-transformer'
import { APIMethod, APIStatus, VersionChangeType, VersionStatus } from 'prisma/generated/client'

@Exclude()
export class ApiVersionBriefDto {
  @Expose()
  id: string

  @Expose()
  revision: number

  @Expose()
  version?: string

  @Expose()
  status: VersionStatus

  @Expose()
  summary?: string

  @Expose()
  changelog?: string

  @Expose()
  changes: VersionChangeType[]

  @Expose()
  editorId: string

  @Expose()
  apiId: string

  @Expose()
  projectId: string

  @Expose()
  publishedAt?: Date

  @Expose()
  createdAt: Date

  /** 快照中的当前 API 状态 */
  @Expose()
  @Transform(({ obj }) => obj.snapshot?.status, { toClassOnly: true })
  apiStatus?: APIStatus

  /** 快照中的描述信息 */
  @Expose()
  @Transform(({ obj }) => obj.snapshot?.description, { toClassOnly: true })
  description?: string
}

@Exclude()
export class ApiVersionsDto {
  @Expose()
  @Type(() => ApiVersionBriefDto)
  versions: ApiVersionBriefDto[]
}

@Exclude()
export class ApiVersionDetailDto extends ApiVersionBriefDto {
  /** 快照中的名称 */
  @Expose()
  @Transform(({ obj }) => obj.snapshot?.name, { toClassOnly: true })
  name: string

  /** 快照中的请求方法 */
  @Expose()
  @Transform(({ obj }) => obj.snapshot?.method, { toClassOnly: true })
  method: APIMethod

  /** 快照中的路径 */
  @Expose()
  @Transform(({ obj }) => obj.snapshot?.path, { toClassOnly: true })
  path: string

  /** 快照中的标签 */
  @Expose()
  @Transform(({ obj }) => obj.snapshot?.tags, { toClassOnly: true })
  tags: string[]

  /** 快照中的排序字段 */
  @Expose()
  @Transform(({ obj }) => obj.snapshot?.sortOrder, { toClassOnly: true })
  sortOrder: number

  /** 请求头定义 */
  @Expose()
  @Transform(({ obj }) => obj.snapshot?.requestHeaders, { toClassOnly: true })
  requestHeaders: Record<string, any>[]

  /** 路径参数定义 */
  @Expose()
  @Transform(({ obj }) => obj.snapshot?.pathParams, { toClassOnly: true })
  pathParams: Record<string, any>[]

  /** 查询参数定义 */
  @Expose()
  @Transform(({ obj }) => obj.snapshot?.queryParams, { toClassOnly: true })
  queryParams: Record<string, any>[]

  /** 请求体定义 */
  @Expose()
  @Transform(({ obj }) => obj.snapshot?.requestBody, { toClassOnly: true })
  requestBody?: Record<string, any>

  /** 响应定义 */
  @Expose()
  @Transform(({ obj }) => obj.snapshot?.responses, { toClassOnly: true })
  responses: Record<string, any>[]

  /** 示例数据 */
  @Expose()
  @Transform(({ obj }) => obj.snapshot?.examples, { toClassOnly: true })
  examples: Record<string, any>

  /** Mock 配置 */
  @Expose()
  @Transform(({ obj }) => obj.snapshot?.mockConfig, { toClassOnly: true })
  mockConfig?: Record<string, any>
}

@Exclude()
export class ApiVersionComparisonDto {
  @Expose()
  @Type(() => ApiVersionDetailDto)
  from: ApiVersionDetailDto

  @Expose()
  @Type(() => ApiVersionDetailDto)
  to: ApiVersionDetailDto

  /** 两个版本的字段差异 */
  @Expose()
  diff: Record<string, any>
}
