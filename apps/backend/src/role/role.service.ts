import { Injectable, Logger } from '@nestjs/common'
import { RoleWhereInput } from 'prisma/generated/models'
import { ErrorCode } from '@/common/exceptions/error-code'
import { HanaException } from '@/common/exceptions/hana.exception'
import { PrismaService } from '@/infra/prisma/prisma.service'
import {
  AssignPermissionsReqDto,
  CreateRoleReqDto,
  GetRolesReqDto,
  UpdateRoleReqDto,
} from './dto'

@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name)

  constructor(private readonly prisma: PrismaService) {}

  /** 创建角色 */
  async createRole(createDto: CreateRoleReqDto) {
    try {
      // 检查角色名称是否已存在
      const existingRole = await this.prisma.role.findUnique({
        where: { name: createDto.name },
      })

      if (existingRole) {
        throw new HanaException(
          `角色 "${createDto.name}" 已存在`,
          ErrorCode.ROLE_NAME_EXISTS,
          409,
        )
      }

      const { permissionIds, ...roleData } = createDto

      // 如果提供了权限ID，验证权限是否存在
      if (permissionIds && permissionIds.length > 0) {
        const permissions = await this.prisma.permission.findMany({
          where: { id: { in: permissionIds } },
        })

        if (permissions.length !== permissionIds.length) {
          const foundIds = permissions.map(p => p.id)
          const missingIds = permissionIds.filter(id => !foundIds.includes(id))
          throw new HanaException(
            `以下权限不存在: ${missingIds.join(', ')}`,
            ErrorCode.PERMISSION_NOT_FOUND,
            404,
          )
        }
      }

      // 创建角色
      const role = await this.prisma.role.create({
        data: {
          ...roleData,
          rolePermissions: permissionIds
            ? {
                create: permissionIds.map(permissionId => ({
                  permissionId,
                })),
              }
            : undefined,
        },
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      })

      this.logger.log(`创建角色成功: ${role.name}`)
      return role
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }
      this.logger.error('创建角色失败:', error)
      throw new HanaException('创建角色失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /** 获取角色列表 */
  async getRoles(queryDto: GetRolesReqDto = {}) {
    try {
      const { keyword, type } = queryDto

      const where: RoleWhereInput = {}

      if (keyword) {
        where.OR = [
          { name: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } },
        ]
      }

      if (type) {
        where.type = type
      }

      const [roles, total] = await Promise.all([
        this.prisma.role.findMany({
          where,
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
          orderBy: [
            { type: 'desc' },
            { createdAt: 'asc' },
          ],
        }),
        this.prisma.role.count({ where }),
      ])

      return {
        roles,
        total,
      }
    }
    catch (error) {
      this.logger.error('获取角色列表失败:', error)
      throw new HanaException('获取角色列表失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /** 根据ID获取角色详情 */
  async getRoleById(id: string) {
    try {
      const role = await this.prisma.role.findUnique({
        where: { id },
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      })

      if (!role) {
        throw new HanaException('角色不存在', ErrorCode.ROLE_NOT_FOUND, 404)
      }

      return role
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }
      this.logger.error('获取角色详情失败:', error)
      throw new HanaException('获取角色详情失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /** 更新角色 */
  async updateRole(id: string, updateDto: UpdateRoleReqDto) {
    try {
      // 检查角色是否存在
      const existingRole = await this.prisma.role.findUnique({ where: { id } })

      if (!existingRole) {
        throw new HanaException('角色不存在', ErrorCode.ROLE_NOT_FOUND, 404)
      }

      // 如果要更新名称，检查新名称是否已存在
      if (updateDto.name && updateDto.name !== existingRole.name) {
        const nameExists = await this.prisma.role.findUnique({
          where: { name: updateDto.name },
        })

        if (nameExists) {
          throw new HanaException(
            `角色名称 "${updateDto.name}" 已存在`,
            ErrorCode.ROLE_NAME_EXISTS,
            409,
          )
        }
      }

      const updatedRole = await this.prisma.role.update({
        where: { id },
        data: updateDto,
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      })

      this.logger.log(`更新角色成功: ${updatedRole.name}`)
      return updatedRole
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }
      this.logger.error('更新角色失败:', error)
      throw new HanaException('更新角色失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /** 删除角色 */
  async deleteRole(id: string): Promise<void> {
    try {
      const role = await this.prisma.role.findUnique({
        where: { id },
      })

      if (!role) {
        throw new HanaException('角色不存在', ErrorCode.ROLE_NOT_FOUND, 404)
      }

      // 检查是否为系统角色
      if (role.type === 'SYSTEM') {
        throw new HanaException(
          '系统角色不能删除',
          ErrorCode.SYSTEM_ROLE_CANNOT_DELETE,
          400,
        )
      }

      await this.prisma.role.delete({
        where: { id },
      })

      this.logger.log(`删除角色成功: ${role.name}`)
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }
      this.logger.error('删除角色失败:', error)
      throw new HanaException('删除角色失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /** 为角色分配权限 */
  // TODO: 某些权限不能分配给当前 type 以外的角色
  async assignPermissions(roleId: string, assignDto: AssignPermissionsReqDto) {
    try {
      const { permissionIds } = assignDto

      // 检查角色是否存在
      const role = await this.prisma.role.findUnique({
        where: { id: roleId },
      })

      if (!role) {
        throw new HanaException('角色不存在', ErrorCode.ROLE_NOT_FOUND, 404)
      }

      // 验证权限是否存在
      const permissions = await this.prisma.permission.findMany({
        where: { id: { in: permissionIds } },
      })

      if (permissions.length !== permissionIds.length) {
        const foundIds = permissions.map(p => p.id)
        const missingIds = permissionIds.filter(id => !foundIds.includes(id))
        throw new HanaException(
          `以下权限不存在: ${missingIds.join(', ')}`,
          ErrorCode.PERMISSION_NOT_FOUND,
          404,
        )
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.rolePermission.deleteMany({
          where: { roleId },
        })

        if (permissionIds.length > 0) {
          await tx.rolePermission.createMany({
            data: permissionIds.map(permissionId => ({
              roleId,
              permissionId,
            })),
          })
        }
      })

      this.logger.log(`为角色 ${role.name} 分配权限成功，共 ${permissionIds.length} 个权限`)

      return await this.getRoleById(roleId)
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }
      this.logger.error('分配权限失败:', error)
      throw new HanaException('分配权限失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /** 获取用户在特定上下文中的所有权限 */
  async getUserPermissions(userId: string, teamId?: string, projectId?: string) {
    try {
      const permissionSets: string[][] = []

      if (teamId) {
        // 获取团队角色权限
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

        if (teamMember) {
          const teamPermissions = teamMember.role.rolePermissions.map(rp => rp.permission.name)
          permissionSets.push(teamPermissions)
        }
      }

      if (projectId) {
        // 获取项目角色权限
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

        if (projectMember) {
          const projectPermissions = projectMember.role.rolePermissions.map(rp => rp.permission.name)
          permissionSets.push(projectPermissions)
        }
      }

      // 合并所有权限（去重）
      const allPermissions = [...new Set(permissionSets.flat())]
      return allPermissions
    }
    catch (error) {
      this.logger.error('获取用户权限失败:', error)
      throw new HanaException('获取用户权限失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /** 获取某个特定角色 */
  async getRole(by: 'id' | 'name', value: string) {
    try {
      const role = await this.prisma.role.findUnique({
        where: by === 'id' ? { id: value } : { name: value },
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      })

      if (!role) {
        throw new HanaException('角色不存在', ErrorCode.ROLE_NOT_FOUND, 404)
      }

      return role
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }
      this.logger.error('获取角色详情失败:', error)
      throw new HanaException('获取角色详情失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }
}
