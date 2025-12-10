import { HttpException, HttpStatus } from '@nestjs/common'
import { format } from 'date-fns'

export class HanaException extends HttpException {
  constructor(message: string, errorCode = 10001, code = HttpStatus.BAD_REQUEST) {
    super(
      {
        code,
        message,
        errorCode,
        timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      },
      code,
    )
  }
}
