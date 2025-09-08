import { Exclude, Expose } from 'class-transformer'
import { MessageResDto } from '@/common/dto/message.dto'

@Exclude()
export class RemoveMemberResDto extends MessageResDto {
  @Expose()
  removedMemberId: string
}
