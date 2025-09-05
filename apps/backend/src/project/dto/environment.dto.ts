import { Exclude, Expose } from 'class-transformer'
import { ProjectEnvType } from '@/constants/project-env'

@Exclude()
export class ProjectEnvDto {
  @Expose()
  id: string

  @Expose()
  name: string

  @Expose()
  type: ProjectEnvType

  @Expose()
  baseUrl: string

  @Expose()
  isDefault: boolean
}
