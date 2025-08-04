import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common'
import type { Observable } from 'rxjs'
import { Injectable } from '@nestjs/common'
import { map } from 'rxjs/operators'

export interface Response<T> {
  data: T
  code: number
  success: boolean
  message: string
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        return {
          data,
          code: 200,
          success: true,
          message: 'success',
        }
      }),
    )
  }
}
