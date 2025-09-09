import { Exclude, Expose, Transform, Type } from 'class-transformer'

@Exclude()
export class PermissionDto {
  @Expose() id: string
  @Expose() name: string

  @Expose()
  @Transform(({ value }) => (value !== null ? value : undefined), { toPlainOnly: true })
  description?: string

  @Expose() resource: string
  @Expose() action: string
  @Expose() createdAt: Date
}

@Exclude()
export class PermissionsDto {
  @Expose()
  total: number

  @Expose()
  @Type(() => PermissionDto)
  permissions: PermissionDto[]
}
