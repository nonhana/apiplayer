import type { ProjectEnvType } from '@/constants/project-env'
import { Exclude, Expose, Type } from 'class-transformer'

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
