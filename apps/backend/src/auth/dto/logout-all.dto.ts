import { Exclude, Expose } from 'class-transformer'
import { MessageResDto } from '@/common/dto/message.dto'

@Exclude()
export class LogoutAllResDto extends MessageResDto {
  @Expose()
  destroyedSessions: number
}
