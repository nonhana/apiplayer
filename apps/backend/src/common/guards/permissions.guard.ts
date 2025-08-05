import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { FastifyRequest } from 'fastify'
import { ErrorCode } from '@/common/exceptions/error-code'
import { HanaException } from '@/common/exceptions/hana.exception'
import { PermissionType } from '@/constants/permission'
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator'

/** 权限守卫，检查用户是否拥有访问某个接口所需的权限 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name)

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. 获取路由上定义的所需权限
    const requiredPermissions = this.reflector.getAllAndOverride<PermissionType[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    )

    // 如果没有设置权限要求，则默认允许访问
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true
    }

    // 2. 获取请求中的 user 对象（由 AuthGuard 添加）
    const request = context.switchToHttp().getRequest<FastifyRequest>()
    const user = request.user

    if (!user) {
      this.logger.warn('用户未登录，无法进行权限验证')
      throw new HanaException('请先登录', ErrorCode.SESSION_EXPIRED, 401)
    }

    // 3. 检查用户的权限
    const userPermissions = user.permissions || []

    this.logger.debug(`用户 ${user.username} 拥有权限: ${userPermissions.join(', ')}`)
    this.logger.debug(`接口需要权限: ${requiredPermissions.join(', ')}`)

    // 4. 检查用户是否拥有所有必需的权限
    const hasAllPermissions = requiredPermissions.every(permission =>
      userPermissions.includes(permission),
    )

    if (hasAllPermissions) {
      this.logger.debug(`用户 ${user.username} 权限验证通过`)
      return true
    }

    // 5. 权限不足，记录日志并抛出异常
    const missingPermissions = requiredPermissions.filter(
      permission => !userPermissions.includes(permission),
    )

    this.logger.warn(
      `用户 ${user.username} 权限不足，缺少权限: ${missingPermissions.join(', ')}`,
    )

    throw new HanaException(
      `权限不足，需要以下权限: ${missingPermissions.join(', ')}`,
      ErrorCode.INSUFFICIENT_PERMISSIONS,
      403,
    )
  }
}
