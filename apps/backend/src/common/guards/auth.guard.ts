import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { FastifyRequest } from 'fastify'
import { ErrorCode } from '@/common/exceptions/error-code'
import { HanaException } from '@/common/exceptions/hana.exception'
import { AuthService } from '../../auth/auth.service'

/** 认证守卫，验证用户是否已登录，并将用户信息附加到请求对象上 */
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name)

  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 检查是否为公开路由
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) {
      return true
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>()

    try {
      // 从 Cookie 中获取 Session ID
      const sessionId = this.extractSessionId(request)

      if (!sessionId) {
        throw new UnauthorizedException('未提供有效的会话标识')
      }

      this.logger.log(`Session ID: ${sessionId}`)

      // 验证会话并获取用户信息
      const user = await this.authService.validateSession(sessionId)

      if (!user) {
        throw new UnauthorizedException('会话已过期或无效，请重新登录')
      }

      // 将用户信息和会话 ID 附加到请求对象上
      request.user = user
      request.sessionId = sessionId

      return true
    }
    catch (error) {
      if (error instanceof UnauthorizedException) {
        throw new HanaException(error.message, ErrorCode.SESSION_EXPIRED, 401)
      }
      this.logger.error('认证验证失败:', error)
      throw new HanaException('认证失败，请重新登录', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /** 从请求中提取 Session ID */
  private extractSessionId(request: FastifyRequest): string | null {
    const cookies = request.cookies || {}
    return cookies.sid || null
  }
}
