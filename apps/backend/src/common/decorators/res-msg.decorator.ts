import { SetMetadata } from '@nestjs/common'

export const RES_MSG = 'resMsg'

export const ResMsg = (msg: string) => SetMetadata(RES_MSG, msg)
