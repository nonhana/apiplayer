import { Exclude, Expose } from 'class-transformer'

@Exclude()
export class MessageResDto {
  @Expose() message: string
}
