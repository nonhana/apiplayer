import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { RES_MSG } from '@/common/decorators/res-msg.decorator'

export interface Response<T> {
  data?: T
  code: number
  success: boolean
  message: string
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const resMsg = this.reflector.getAllAndOverride<string>(RES_MSG, [context.getHandler()])

    return next.handle().pipe(
      map((data) => {
        if (data === null || data === undefined) {
          return {
            code: 200,
            success: true,
            message: resMsg || 'success',
          }
        }

        return {
          data,
          code: 200,
          success: true,
          message: resMsg || 'success',
        }
      }),
    )
  }
}
