import { Exclude, Expose, Transform } from 'class-transformer'

@Exclude()
export class PermissionDto {
  @Expose() id: string
  @Expose() name: string

  @Expose()
  @Transform(({ value }) => (value !== null ? value : undefined))
  description?: string

  @Expose() resource: string
  @Expose() action: string
  @Expose() createdAt: Date
}
