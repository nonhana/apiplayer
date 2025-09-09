import { Exclude, Expose } from 'class-transformer'
import { MessageResDto } from '@/common/dto/message.dto'

@Exclude()
export class CheckAuthStatusResDto extends MessageResDto {
  @Expose()
  isAuthenticated: boolean
}
