import type { ErrorCode, ErrorName } from '@apiplayer/shared'
import { getError } from '@apiplayer/shared'
import { HttpException, HttpStatus } from '@nestjs/common'
import { format } from 'date-fns'

export interface HanaErrorData {
  status: number
  message: string
  code: number
  timestamp?: string
}

export class HanaException extends HttpException {
  constructor(errorName: ErrorName)
  constructor(message: string, code: ErrorCode, status: HttpStatus)

  constructor(
    nameOrMsg: ErrorName | string,
    codeOrUndefined?: ErrorCode,
    statusOrUndefined?: HttpStatus,
  ) {
    let message: string
    let code: ErrorCode
    let status: HttpStatus

    if (codeOrUndefined !== undefined) {
      message = nameOrMsg
      code = codeOrUndefined
      status = statusOrUndefined!
    }
    else {
      const error = getError(nameOrMsg as ErrorName)
      message = error.message
      code = error.code
      status = error.status
    }

    const errorData: HanaErrorData = {
      status,
      message,
      code,
      timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    }

    super(errorData, status)
  }
}
