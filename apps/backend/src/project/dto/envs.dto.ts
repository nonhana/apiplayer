import { Exclude, Expose, Type } from 'class-transformer'
import { ProjectEnvDto } from './project-env.dto'

@Exclude()
export class ProjectEnvsResDto {
  @Expose()
  @Type(() => ProjectEnvDto)
  environments: ProjectEnvDto[]

  @Expose()
  total: number
}
