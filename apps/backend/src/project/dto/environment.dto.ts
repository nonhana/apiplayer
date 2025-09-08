import type { ProjectEnvType } from '@/constants/project-env'
import { Exclude, Expose } from 'class-transformer'

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
