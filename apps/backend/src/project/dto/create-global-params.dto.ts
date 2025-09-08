import { Expose, Type } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import { MessageResDto } from '@/common/dto/message.dto'
import { CreateGlobalParamDto } from './create-global-param.dto'
import { GlobalParamDto } from './global-param.dto'

export class CreateGlobalParamsDto {
  @IsNotEmpty({ message: '参数列表不能为空' })
  params: CreateGlobalParamDto[]
}

export class CreateGlobalParamsResDto extends MessageResDto {
  @Expose()
  createdCount: number

  @Expose()
  @Type(() => GlobalParamDto)
  params: GlobalParamDto[]
}
