import { Exclude, Expose } from 'class-transformer'

@Exclude()
export class LogoutAllResDto {
  @Expose()
  destroyedSessions: number
}
