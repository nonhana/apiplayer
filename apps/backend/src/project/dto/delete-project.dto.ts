import { Exclude, Expose } from 'class-transformer'
import { MessageResDto } from '@/common/dto/message.dto'

@Exclude()
export class DeleteProjectResDto extends MessageResDto {
  @Expose()
  deletedProjectId: string
}
