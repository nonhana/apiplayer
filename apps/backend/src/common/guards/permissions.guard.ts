import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { FastifyRequest } from 'fastify'
import {
  CONTEXT_PERMISSIONS_KEY,
  PROJECT_CONTEXT_KEY,
  SYSTEM_CONTEXT_KEY,
  TEAM_CONTEXT_KEY,
} from '@/common/decorators/permissions.decorator'
import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator'
import { HanaException } from '@/common/exceptions/hana.exception'
import { PermissionContext, PermissionContextConfig, PermissionContextParamName } from '@/common/types/permission'
import { PermissionCheckerService } from '@/permission/permission-checker.service'

/**
 * 权限守卫
 * @description 验证用户是否具有相应的权限
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name)

  constructor(
    private readonly reflector: Reflector,
    private readonly permissionCheckerService: PermissionCheckerService,
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

    // 检查是否设置了上下文权限要求
    const contextConfig = this.reflector.getAllAndOverride<PermissionContextConfig>(
      CONTEXT_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    )

    // 检查是否设置了团队成员要求
    const teamContext = this.reflector.getAllAndOverride<{ paramName: PermissionContextParamName }>(
      TEAM_CONTEXT_KEY,
      [context.getHandler(), context.getClass()],
    )

    // 检查是否设置了项目成员要求
    const projectContext = this.reflector.getAllAndOverride<{ paramName: PermissionContextParamName }>(
      PROJECT_CONTEXT_KEY,
      [context.getHandler(), context.getClass()],
    )

    // 检查是否设置了系统管理员要求
    const isSystemAdmin = this.reflector.getAllAndOverride<boolean>(
      SYSTEM_CONTEXT_KEY,
      [context.getHandler(), context.getClass()],
    )

    // 如果没有设置任何权限要求，则默认允许访问
    if (!contextConfig && !teamContext && !projectContext && !isSystemAdmin) {
      return true
    }

    // 获取请求中的 user 对象（由 AuthGuard 添加）
    const request = context.switchToHttp().getRequest<FastifyRequest>()
    const user = request.user

    if (!user) {
      this.logger.warn('用户未登录，无法进行权限验证')
      throw new HanaException('SESSION_EXPIRED')
    }

    try {
      // 处理团队成员检查
      if (teamContext) {
        const teamId = this.extractContextId(request, teamContext.paramName)
        if (!teamId) {
          throw new HanaException('INVALID_PARAMS')
        }

        const isTeamMember = await this.permissionCheckerService.isTeamMember(user.id, teamId)
        if (!isTeamMember) {
          this.logger.warn(`用户 ${user.username} 不是团队 ${teamId} 的成员`)
          throw new HanaException('NOT_TEAM_MEMBER')
        }

        this.logger.debug(`用户 ${user.username} 团队成员身份验证通过`)
      }

      // 处理项目成员检查
      if (projectContext) {
        const projectId = this.extractContextId(request, projectContext.paramName)
        if (!projectId) {
          throw new HanaException('INVALID_PARAMS')
        }

        const isProjectMember = await this.permissionCheckerService.isProjectMember(user.id, projectId)
        if (!isProjectMember) {
          this.logger.warn(`用户 ${user.username} 不是项目 ${projectId} 的成员`)
          throw new HanaException('NOT_PROJECT_MEMBER')
        }

        this.logger.debug(`用户 ${user.username} 项目成员身份验证通过`)
      }

      // 处理系统管理员检查
      if (isSystemAdmin) {
        this.logger.debug(`用户 ${user.username} 系统管理员身份验证通过`)
        return true
      }

      // 处理上下文权限检查
      if (contextConfig) {
        const permissionContext = await this.buildPermissionContext(request, contextConfig)

        // 如果是系统管理员，跳过权限检查
        const isSystemAdmin = await this.permissionCheckerService.isSystemAdmin(user.id)
        if (isSystemAdmin) {
          this.logger.debug(`用户 ${user.username} 系统管理员身份验证通过`)
          return true
        }

        // 正常权限检查
        const hasPermissions = await this.permissionCheckerService.hasPermissions(
          user.id,
          permissionContext,
          contextConfig.permissions,
        )

        if (!hasPermissions) {
          const userPermissions = await this.permissionCheckerService.getUserPermissionsInContext(
            user.id,
            permissionContext,
          )

          const missingPermissions = contextConfig.permissions.filter(
            permission => !userPermissions.permissions.includes(permission),
          )

          this.logger.warn(
            `用户 ${user.username} 在上下文 ${JSON.stringify(permissionContext)} 中权限不足，缺少权限: ${missingPermissions.join(', ')}`,
          )

          throw new HanaException('INSUFFICIENT_PERMISSIONS')
        }

        this.logger.debug(`用户 ${user.username} 上下文权限验证通过`)
      }

      return true
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }
      this.logger.error('权限验证失败:', error)
      throw new HanaException('INTERNAL_SERVER_ERROR')
    }
  }

  /**
   * 构建权限上下文
   */
  private async buildPermissionContext(
    request: FastifyRequest,
    config: PermissionContextConfig,
  ): Promise<PermissionContext> {
    const context: PermissionContext = {
      type: config.type,
    }

    // 如果需要上下文ID，从请求参数中提取
    if (config.paramName) {
      const contextId = this.extractContextId(request, config.paramName)
      if (!contextId) {
        throw new HanaException('INVALID_PARAMS')
      }
      context.id = contextId
    }

    return context
  }

  /**
   * 从请求中提取上下文ID（主要是为了避免每次都得手动写）
   * @description 根据传进来的 paramName，尝试从路径参数、查询参数或请求体中提取对应的值
   */
  private extractContextId(request: FastifyRequest, paramName: PermissionContextParamName) {
    // 优先从路径参数中获取
    const params = request.params as Record<string, string> || {}
    if (params[paramName]) {
      return params[paramName] as string
    }

    // 然后从查询参数中获取
    const query = request.query as Record<string, string> || {}
    if (query[paramName]) {
      return query[paramName] as string
    }

    // 最后从请求体中获取
    const body = request.body as Record<string, any> || {}
    if (body[paramName]) {
      return body[paramName] as string
    }

    return null
  }
}
