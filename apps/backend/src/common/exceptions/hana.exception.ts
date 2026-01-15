import type { ErrorName } from '@apiplayer/shared'
import { getError } from '@apiplayer/shared'
import { HttpException } from '@nestjs/common'
import { format } from 'date-fns'
import { StatusCodes } from 'http-status-codes'

export interface HanaErrorData {
  status: number
  message: string
  code: number // 自定义的错误码
  timestamp?: string
}

export interface HanaErrorOptions {
  message?: string
  status?: StatusCodes
}

export class HanaException extends HttpException {
  constructor(errorName: ErrorName, options?: HanaErrorOptions) {
    const { message, status } = options ?? {}
    const error = getError(errorName)

    const errorData: HanaErrorData = {
      status: status ?? error.status,
      message: message ?? error.message,
      code: error.code,
      timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    }

    super(errorData, status ?? error.status)
  }
}
