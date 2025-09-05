import { Exclude, Expose } from 'class-transformer'

@Exclude()
export class ProjectTeamDto {
  @Expose()
  id: string

  @Expose()
  name: string

  @Expose()
  slug: string
}
