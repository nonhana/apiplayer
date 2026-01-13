import type { HanaErrorData } from '../exceptions/hana.exception'
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common'
import { FastifyReply } from 'fastify'
import { HanaException } from '../exceptions/hana.exception'

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<FastifyReply>()

    // 处理 HanaException
    if (exception instanceof HanaException) {
      const code = exception.getStatus()
      const responseData = exception.getResponse()

      response.status(code).send(responseData)
      return
    }

    // 处理其他 HttpException
    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      const responseData = exception.getResponse()

      let errorData: HanaErrorData

      // 如果响应数据是字符串，包装成对象
      if (typeof responseData === 'string') {
        errorData = {
          status,
          message: responseData,
          code: status,
        }
      }
      else {
        // 类型断言以处理对象类型的响应数据
        const data = responseData as Record<string, any>
        errorData = {
          status,
          message: data?.message || exception.message || 'Unknown Error',
          code: data?.code || status,
          ...(data?.timestamp && { timestamp: data.timestamp }),
        }
      }

      // 特殊处理文件上传过大的情况
      if (status === HttpStatus.PAYLOAD_TOO_LARGE) {
        errorData.message = '上传文件过大，请根据上传的具体要求说明重新上传'
      }

      response.status(status).send(errorData)
      return
    }

    // 处理其他类型的错误
    const code = (exception as any)?.code
      || (exception as any)?.status
      || HttpStatus.INTERNAL_SERVER_ERROR

    const errorData: HanaErrorData = {
      status: code,
      message: exception.message || '未知错误',
      code,
    }

    response.status(code).send(errorData)
  }
}
