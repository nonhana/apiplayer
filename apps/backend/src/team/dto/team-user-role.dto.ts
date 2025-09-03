import { Exclude, Expose, Transform } from 'class-transformer'

@Exclude()
export class TeamUserRoleDto {
  @Expose() id: string
  @Expose() name: string

  @Expose()
  @Transform(({ value }) => (value !== null ? value : undefined))
  description?: string
}
