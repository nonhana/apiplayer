import { PermissionType, RoleType } from '@apiplayer/shared'
import { Injectable, Logger } from '@nestjs/common'
import { HanaException } from '@/common/exceptions/hana.exception'
import { PermissionContext } from '@/common/types/permission'
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
  ) {
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
  ) {
    try {
      let role: RoleType | null
      let permissions: PermissionType[] = []

      switch (context.type) {
        case 'team':
          if (!context.id) {
            throw new HanaException('INVALID_PARAMS')
          }
          const teamPermissions = await this.getTeamPermissions(userId, context.id)
          role = teamPermissions.role
          permissions = teamPermissions.permissions
          break

        case 'project':
          if (!context.id) {
            throw new HanaException('INVALID_PARAMS')
          }
          const projectPermissions = await this.getProjectPermissions(userId, context.id)
          role = projectPermissions.role
          permissions = projectPermissions.permissions
          break

        default:
          throw new HanaException('INVALID_PARAMS')
      }

      return {
        userId,
        context,
        role,
        permissions,
      }
    }
    catch (error) {
      this.logger.error(`获取用户 ${userId} 在上下文 ${JSON.stringify(context)} 中的权限失败:`, error)
      return {
        userId,
        context,
        role: null,
        permissions: [] as PermissionType[],
      }
    }
  }

  /** 获取用户在特定团队中的权限 */
  private async getTeamPermissions(userId: string, teamId: string) {
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
      return { role: null, permissions: [] }
    }

    const role = teamMember.role.name as RoleType
    const permissions = teamMember.role.rolePermissions.map(rp => rp.permission.name) as PermissionType[]

    return { role, permissions }
  }

  /** 获取用户在特定项目中的权限 */
  private async getProjectPermissions(userId: string, projectId: string) {
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
      return { role: null, permissions: [] }
    }

    const role = projectMember.role.name as RoleType
    const permissions = projectMember.role.rolePermissions.map(rp => rp.permission.name) as PermissionType[]
    return { role, permissions }
  }

  /** 检查用户是否是系统管理员 */
  async isSystemAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    return user?.isAdmin ?? false
  }

  /** 检查用户是否是团队成员 */
  async isTeamMember(userId: string, teamId: string) {
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
  async isProjectMember(userId: string, projectId: string) {
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
