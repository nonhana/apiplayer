import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { FastifyReply, FastifyRequest } from 'fastify'
import { AuthService } from '@/auth/auth.service'
import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator'
import { HanaException } from '@/common/exceptions/hana.exception'
import { CookieService } from '@/cookie/cookie.service'

/**
 * 认证守卫
 * @description 验证用户是否已登录，并将用户信息附加到请求对象上
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name)

  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
    private readonly cookieService: CookieService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 检查是否为公开路由
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) {
      return true
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>()
    const response = context.switchToHttp().getResponse<FastifyReply>()

    try {
      // 从 Cookie 中获取 Session ID
      const sessionId = this.extractSessionId(request)

      if (!sessionId) {
        throw new UnauthorizedException('未提供有效的Session标识')
      }

      this.logger.log(`Session ID: ${sessionId}`)

      // 验证Session并获取用户信息
      const result = await this.authService.validateSession(sessionId)

      if (!result) {
        throw new UnauthorizedException('Session已过期或无效，请重新登录')
      }

      // 将用户信息和Session ID 附加到请求对象上
      request.user = result.user
      request.sessionId = sessionId

      // 无感刷新：每次认证成功后续期 Cookie
      if (result.idleTimeout) {
        this.cookieService.renewSessionCookie(response, sessionId, result.idleTimeout)
      }

      return true
    }
    catch (error) {
      if (error instanceof UnauthorizedException) {
        throw new HanaException('SESSION_EXPIRED')
      }
      this.logger.error('认证验证失败:', error)
      throw new HanaException('INTERNAL_SERVER_ERROR')
    }
  }

  /** 从请求中提取 Session ID */
  private extractSessionId(request: FastifyRequest): string | null {
    const cookies = request.cookies || {}
    return cookies.sid || null
  }
}
