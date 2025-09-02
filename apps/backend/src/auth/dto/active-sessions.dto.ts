import { Exclude, Expose, Type } from 'class-transformer'
import { UserSessionDto } from '@/common/dto/user.dto'

@Exclude()
export class ActiveSessionsResDto {
  @Expose()
  @Type(() => UserSessionDto)
  sessions: UserSessionDto[]

  @Expose()
  total: number
}
