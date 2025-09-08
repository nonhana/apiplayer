import { Exclude, Expose } from 'class-transformer'
import { ProjectEnvType } from '@/common/types/project-env'

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
  variables: Record<string, any>

  @Expose()
  headers: Record<string, any>

  @Expose()
  isDefault: boolean

  @Expose()
  createdAt: Date

  @Expose()
  updatedAt: Date
}
