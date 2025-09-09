import { Exclude, Expose } from 'class-transformer'

@Exclude()
export class DeleteGlobalParamResDto {
  @Expose()
  deletedParamId: string
}
