import { Injectable, Logger } from '@nestjs/common'
import { ErrorCode } from '@/common/exceptions/error-code'
import { HanaException } from '@/common/exceptions/hana.exception'
import { PermissionContext, UserPermissions } from '@/common/types/permission'
import { PermissionType } from '@/constants/permission'
import { RoleType } from '@/constants/role'
import { PrismaService } from '@/infra/prisma/prisma.service'

@Injectable()
export class PermissionCheckerService {
  private readonly logger = new Logger(PermissionCheckerService.name)

  constructor(private readonly prisma: PrismaService) {}

  /** 检查用户是否拥有特定权限 */
  async hasPermissions(
    userId: string,
    context: PermissionContext,
    requiredPermissions: PermissionType[],
  ): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissionsInContext(userId, context)

      // 检查是否拥有所有必需的权限
      const hasAllPermissions = requiredPermissions.every(permission =>
        userPermissions.permissions.includes(permission),
      )

      this.logger.debug(
        `用户 ${userId} 在上下文 ${JSON.stringify(context)} 中权限检查: ${hasAllPermissions}`,
      )

      return hasAllPermissions
    }
    catch (error) {
      this.logger.error('权限检查失败:', error)
      return false
    }
  }

  /** 获取用户在特定上下文中的权限信息 */
  async getUserPermissionsInContext(
    userId: string,
    context: PermissionContext,
  ): Promise<UserPermissions> {
    try {
      let roles: RoleType[] = []
      let permissions: PermissionType[] = []

      switch (context.type) {
        case 'team':
          if (!context.id) {
            throw new HanaException('团队上下文需要提供团队ID', ErrorCode.INVALID_PARAMS)
          }
          const teamPermissions = await this.getTeamPermissions(userId, context.id)
          roles = teamPermissions.roles
          permissions = teamPermissions.permissions
          break

        case 'project':
          if (!context.id) {
            throw new HanaException('项目上下文需要提供项目ID', ErrorCode.INVALID_PARAMS)
          }
          const projectPermissions = await this.getProjectPermissions(userId, context.id)
          roles = projectPermissions.roles
          permissions = projectPermissions.permissions
          break

        default:
          throw new HanaException(`不支持的上下文类型: ${context.type}`, ErrorCode.INVALID_PARAMS)
      }

      return {
        userId,
        context,
        roles,
        permissions,
      }
    }
    catch (error) {
      this.logger.error(`获取用户 ${userId} 在上下文 ${JSON.stringify(context)} 中的权限失败:`, error)
      return {
        userId,
        context,
        roles: [],
        permissions: [],
      }
    }
  }

  /** 获取用户在特定团队中的权限 */
  private async getTeamPermissions(userId: string, teamId: string):
  Promise<{ roles: RoleType[], permissions: PermissionType[] }> {
    const teamMember = await this.prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    })

    if (!teamMember) {
      this.logger.debug(`用户 ${userId} 不是团队 ${teamId} 的成员`)
      return { roles: [], permissions: [] }
    }

    const roles = [teamMember.role.name] as RoleType[]
    const permissions = teamMember.role.rolePermissions.map(rp => rp.permission.name) as PermissionType[]

    return { roles, permissions }
  }

  /** 获取用户在特定项目中的权限 */
  private async getProjectPermissions(userId: string, projectId: string):
  Promise<{ roles: RoleType[], permissions: PermissionType[] }> {
    // 首先检查用户是否是项目的直接成员
    const projectMember = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    })

    if (!projectMember) {
      this.logger.debug(`用户 ${userId} 不是项目 ${projectId} 的成员`)
      return { roles: [], permissions: [] }
    }

    const roles = [projectMember.role.name] as RoleType[]
    const permissions = projectMember.role.rolePermissions.map(rp => rp.permission.name) as PermissionType[]
    return { roles, permissions }
  }

  /** 检查用户是否是系统管理员 */
  async isSystemAdmin(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    return user?.isAdmin ?? false
  }

  /** 检查用户是否是团队成员 */
  async isTeamMember(userId: string, teamId: string): Promise<boolean> {
    const teamMember = await this.prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    })

    return !!teamMember
  }

  /** 检查用户是否是项目成员 */
  async isProjectMember(userId: string, projectId: string): Promise<boolean> {
    const projectMember = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    })

    return !!projectMember
  }
}
