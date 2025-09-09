import { SetMetadata } from '@nestjs/common'

export const RES_MSG = 'resMsg'

export const ResMsg = (message: string) => SetMetadata(RES_MSG, message)
