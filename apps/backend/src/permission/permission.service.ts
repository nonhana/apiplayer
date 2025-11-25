import { Injectable, Logger } from '@nestjs/common'
import { Permission } from 'prisma/generated/client'
import { ErrorCode } from '@/common/exceptions/error-code'
import { HanaException } from '@/common/exceptions/hana.exception'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { CreatePermissionReqDto, CreatePermissionsReqDto, GetPermissionsReqDto, UpdatePermissionReqDto } from './dto'

@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name)

  constructor(private readonly prisma: PrismaService) {}

  /** 创建单个权限 */
  async createPermission(createDto: CreatePermissionReqDto) {
    try {
      // 检查权限名称是否已存在
      const existingPermission = await this.prisma.permission.findUnique({
        where: { name: createDto.name },
      })

      if (existingPermission) {
        throw new HanaException(
          `权限 "${createDto.name}" 已存在`,
          ErrorCode.PERMISSION_NAME_EXISTS,
          409,
        )
      }

      const permission = await this.prisma.permission.create({ data: createDto })

      this.logger.log(`创建权限成功: ${permission.name}`)

      return permission
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }
      this.logger.error('创建权限失败:', error)
      throw new HanaException('创建权限失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /** 批量创建权限 */
  async createPermissions(createDto: CreatePermissionsReqDto) {
    try {
      const { permissions } = createDto
      const createdPermissions: Permission[] = []

      // 检查所有权限名称是否已存在
      const permissionNames = permissions.map(p => p.name)
      const existingPermissions = await this.prisma.permission.findMany({
        where: {
          name: { in: permissionNames },
        },
      })

      if (existingPermissions.length > 0) {
        const existingNames = existingPermissions.map(p => p.name)
        throw new HanaException(
          `以下权限已存在: ${existingNames.join(', ')}`,
          ErrorCode.PERMISSION_NAME_EXISTS,
          409,
        )
      }

      // 批量创建
      for (const permissionDto of permissions) {
        const permission = await this.prisma.permission.create({
          data: permissionDto,
        })
        createdPermissions.push(permission)
      }

      this.logger.log(`批量创建权限成功，共创建 ${createdPermissions.length} 个权限`)
      return createdPermissions
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }
      this.logger.error('批量创建权限失败:', error)
      throw new HanaException('批量创建权限失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /** 根据ID获取权限详情 */
  async getPermissionById(id: string) {
    try {
      const permission = await this.prisma.permission.findUnique({ where: { id } })

      if (!permission) {
        throw new HanaException('权限不存在', ErrorCode.PERMISSION_NOT_FOUND, 404)
      }

      return permission
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }
      this.logger.error('获取权限详情失败:', error)
      throw new HanaException('获取权限详情失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /** 查询权限列表 */
  async getPermissions(queryDto: GetPermissionsReqDto = {}) {
    try {
      const { resource, action, keyword } = queryDto

      const where: any = {}

      if (resource) {
        where.resource = resource
      }

      if (action) {
        where.action = action
      }

      if (keyword) {
        where.OR = [
          { name: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } },
        ]
      }

      const [permissions, total] = await Promise.all([
        this.prisma.permission.findMany({
          where,
          orderBy: [
            { resource: 'asc' },
            { action: 'asc' },
            { name: 'asc' },
          ],
        }),
        this.prisma.permission.count({ where }),
      ])

      return {
        permissions,
        total,
      }
    }
    catch (error) {
      this.logger.error('查询权限列表失败:', error)
      throw new HanaException('查询权限列表失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /** 更新权限 */
  async updatePermission(id: string, updateDto: UpdatePermissionReqDto) {
    try {
      // 检查权限是否存在
      const existingPermission = await this.prisma.permission.findUnique({ where: { id } })

      if (!existingPermission) {
        throw new HanaException('权限不存在', ErrorCode.PERMISSION_NOT_FOUND, 404)
      }

      // 如果要更新名称，检查新名称是否已存在
      if (updateDto.name && updateDto.name !== existingPermission.name) {
        const nameExists = await this.prisma.permission.findUnique({
          where: { name: updateDto.name },
        })

        if (nameExists) {
          throw new HanaException(
            `权限名称 "${updateDto.name}" 已存在`,
            ErrorCode.PERMISSION_NAME_EXISTS,
            409,
          )
        }
      }

      const updatedPermission = await this.prisma.permission.update({
        where: { id },
        data: updateDto,
      })

      this.logger.log(`更新权限成功: ${updatedPermission.name}`)
      return updatedPermission
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }
      this.logger.error('更新权限失败:', error)
      throw new HanaException('更新权限失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /** 删除权限 */
  async deletePermission(id: string) {
    try {
      const permission = await this.prisma.permission.findUnique({ where: { id } })

      if (!permission) {
        throw new HanaException('权限不存在', ErrorCode.PERMISSION_NOT_FOUND, 404)
      }

      await this.prisma.permission.delete({ where: { id } })

      this.logger.log(`删除权限成功: ${permission.name}`)
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }
      this.logger.error('删除权限失败:', error)
      throw new HanaException('删除权限失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /** 根据权限名称获取权限 */
  async getPermissionByName(name: string) {
    try {
      return await this.prisma.permission.findUnique({ where: { name } })
    }
    catch (error) {
      this.logger.error('根据名称获取权限失败:', error)
      throw new HanaException('获取权限失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /** 根据资源类型获取权限列表 */
  async getPermissionsByResource(resource: string) {
    try {
      return await this.prisma.permission.findMany({
        where: { resource },
        orderBy: { action: 'asc' },
      })
    }
    catch (error) {
      this.logger.error('根据资源类型获取权限失败:', error)
      throw new HanaException('获取权限失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /** 获取所有资源类型 */
  async getResources() {
    try {
      const result = await this.prisma.permission.findMany({
        select: { resource: true },
        distinct: ['resource'],
        orderBy: { resource: 'asc' },
      })

      return result.map(r => r.resource)
    }
    catch (error) {
      this.logger.error('获取资源类型失败:', error)
      throw new HanaException('获取资源类型失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }
}
