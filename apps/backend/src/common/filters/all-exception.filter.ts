import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common'
import type { FastifyReply } from 'fastify'
import { Catch, HttpException, HttpStatus } from '@nestjs/common'
import { HanaException } from '../exceptions/hana.exception'

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<FastifyReply>()

    // 处理 HanaException
    if (exception instanceof HanaException) {
      const statusCode = exception.getStatus()
      const responseData = exception.getResponse()

      response.status(statusCode).send(responseData)
      return
    }

    // 处理其他 HttpException
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus()
      const responseData = exception.getResponse()

      let errorInfo: Record<string, any>

      // 如果响应数据是字符串，包装成对象
      if (typeof responseData === 'string') {
        errorInfo = {
          statusCode,
          message: responseData,
          errorCode: statusCode,
        }
      }
      else {
        // 类型断言以处理对象类型的响应数据
        const data = responseData as Record<string, any>
        errorInfo = {
          statusCode,
          message: data?.message || exception.message || 'Unknown Error',
          errorCode: data?.errorCode || statusCode,
          ...(data?.timestamp && { timestamp: data.timestamp }),
        }
      }

      // 特殊处理文件上传过大的情况
      if (statusCode === HttpStatus.PAYLOAD_TOO_LARGE) {
        errorInfo.message = '上传文件过大，请根据上传的具体要求说明重新上传'
      }

      response.status(statusCode).send(errorInfo)
      return
    }

    // 处理其他类型的错误
    const statusCode = (exception as any)?.statusCode
      || (exception as any)?.status
      || HttpStatus.INTERNAL_SERVER_ERROR

    const errorInfo = {
      statusCode,
      message: exception.message || 'Internal Server Error',
      errorCode: statusCode,
    }

    response.status(statusCode).send(errorInfo)
  }
}
