import { Exclude, Expose, Transform } from 'class-transformer'

@Exclude()
export class TeamProjectDto {
  @Expose()
  id: string

  @Expose()
  name: string

  @Expose()
  slug: string

  @Expose()
  @Transform(({ value }) => (value !== null ? value : undefined), { toPlainOnly: true })
  description?: string

  @Expose()
  @Transform(({ value }) => (value !== null ? value : undefined), { toPlainOnly: true })
  icon?: string

  @Expose()
  createdAt: Date
}
