import { Exclude, Expose } from 'class-transformer'

@Exclude()
export class RemoveMemberResDto {
  @Expose()
  removedMemberId: string
}
