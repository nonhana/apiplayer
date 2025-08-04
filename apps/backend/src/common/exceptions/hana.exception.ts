import { HttpException, HttpStatus } from '@nestjs/common'
import { format } from 'date-fns'

export class HanaException extends HttpException {
  constructor(message: string, code = 10001, status = HttpStatus.BAD_REQUEST) {
    super(
      {
        statusCode: status,
        message,
        errorCode: code,
        timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      },
      status,
    )
  }
}
