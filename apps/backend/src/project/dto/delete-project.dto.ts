import { Exclude, Expose } from 'class-transformer'

@Exclude()
export class DeleteProjectResDto {
  @Expose()
  deletedProjectId: string
}
