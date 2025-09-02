import { Exclude, Expose } from 'class-transformer'

@Exclude()
export class LogoutAllResDto {
  @Expose() message: string
  @Expose() destroyedSessions: number
}
