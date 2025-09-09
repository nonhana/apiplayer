import { Exclude, Expose } from 'class-transformer'

@Exclude()
export class CheckAuthStatusResDto {
  @Expose()
  isAuthenticated: boolean
}
