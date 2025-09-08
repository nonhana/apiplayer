import { Exclude, Expose } from 'class-transformer'
import { MessageResDto } from '@/common/dto/message.dto'

@Exclude()
export class DeleteGlobalParamResDto extends MessageResDto {
  @Expose()
  deletedParamId: string
}
