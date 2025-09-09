import { Exclude, Expose } from 'class-transformer'

@Exclude()
export class DeleteProjectEnvResDto {
  @Expose()
  deletedEnvId: string
}
