import { Exclude, Expose } from 'class-transformer'

@Exclude()
export class ProjectEnvDto {
  @Expose()
  id: string

  @Expose()
  name: string

  @Expose()
  type: string
}
