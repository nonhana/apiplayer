import { Exclude, Expose } from 'class-transformer'

@Exclude()
export class DeleteTeamResDto {
  @Expose() message: string
  @Expose() deletedTeamId: string
}
