import { Exclude, Expose, Transform } from 'class-transformer'

@Exclude()
export class RoleBriefDto {
  @Expose()
  id: string

  @Expose()
  name: string

  @Expose()
  @Transform(({ value }) => (value !== null ? value : undefined))
  description?: string
}
