import { Injectable, Logger } from '@nestjs/common'
import { APIOperationType, Prisma, VersionChangeType } from 'prisma/generated/client'
import { ErrorCode } from '@/common/exceptions/error-code'
import { HanaException } from '@/common/exceptions/hana.exception'
import { RoleName } from '@/constants/role'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { RoleService } from '@/role/role.service'
import { CreateProjectReqDto, GetProjectsReqDto, UpdateProjectReqDto } from './dto'
import { ProjectUtilsService } from './utils.service'

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly projectUtilsService: ProjectUtilsService,
    private readonly roleService: RoleService,
  ) {}

  async createProject(dto: CreateProjectReqDto, teamId: string, creatorId: string) {
    const { name, slug, description, icon, isPublic = false } = dto

    try {
      await this.projectUtilsService.checkProjectNameExists(teamId, name)
      await this.projectUtilsService.checkProjectSlugExists(teamId, slug)

      const adminRole = await this.roleService.getRole('name', RoleName.PROJECT_ADMIN)

      const project = await this.prisma.$transaction(async (tx) => {
        // 创建项目
        const project = await tx.project.create({
          data: {
            teamId,
            name,
            slug,
            description,
            icon,
            isPublic,
          },
        })

        // 将创建者添加为项目管理员
        await tx.projectMember.create({
          data: {
            userId: creatorId,
            projectId: project.id,
            roleId: adminRole.id,
          },
        })

        // 创建默认环境
        await tx.projectEnvironment.create({
          data: {
            projectId: project.id,
            name: '开发环境',
            type: 'DEV',
            baseUrl: 'http://your-project-url.com',
            isDefault: true,
          },
        })

        return project
      })

      this.logger.log(`用户 ${creatorId} 在团队 ${teamId} 中创建了项目 ${project.name} (${project.id})`)

      return project
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }

      this.logger.error(`创建项目失败: ${error.message}`, error.stack)
      throw new HanaException('创建项目失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  async getUserProjects(dto: GetProjectsReqDto, userId: string) {
    const { page = 1, limit = 10, search, isPublic, teamId } = dto

    try {
      const skip = (page - 1) * limit

      const whereCondition: Prisma.ProjectWhereInput = {
        status: 'ACTIVE',
        members: {
          some: {
            userId,
          },
        },
        ...(teamId && { teamId }),
        ...(isPublic !== undefined && { isPublic }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
      }

      const [projects, total] = await Promise.all([
        this.prisma.project.findMany({
          where: whereCondition,
          include: {
            team: true,
            members: {
              where: { userId },
              include: {
                role: true,
              },
            },
            _count: {
              select: {
                members: true,
                apis: {
                  where: { recordStatus: 'ACTIVE' },
                },
              },
            },
          },
          skip,
          take: limit,
          orderBy: { updatedAt: 'desc' },
        }),
        this.prisma.project.count({ where: whereCondition }),
      ])

      const totalPages = Math.ceil(total / limit)

      return {
        projects,
        total,
        pagination: {
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      }
    }
    catch (error) {
      this.logger.error(`获取用户项目列表失败: ${error.message}`, error.stack)
      throw new HanaException('获取项目列表失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  async getProjectDetail(projectId: string, userId: string) {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        include: {
          team: true,
          members: {
            include: {
              user: true,
              role: true,
            },
            orderBy: { joinedAt: 'asc' },
            take: 10,
          },
          environments: {
            orderBy: [
              { isDefault: 'desc' },
              { createdAt: 'asc' },
            ],
          },
          _count: {
            select: {
              members: true,
              apis: {
                where: { recordStatus: 'ACTIVE' },
              },
              environments: true,
            },
          },
        },
      })

      if (!project) {
        throw new HanaException('项目不存在', ErrorCode.PROJECT_NOT_FOUND, 404)
      }

      if (project.status !== 'ACTIVE') {
        throw new HanaException('项目已被删除', ErrorCode.PROJECT_DELETED)
      }

      // 记录用户访问
      await this.projectUtilsService.recordUserVisit(userId, projectId)

      return project
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }
      this.logger.error(`获取项目详情失败: ${error.message}`, error.stack)
      throw new HanaException('获取项目详情失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  async updateProject(dto: UpdateProjectReqDto, projectId: string, userId: string) {
    try {
      const existingProject = await this.projectUtilsService.getProjectById(projectId)

      if (dto.name && dto.name !== existingProject.name) {
        await this.projectUtilsService.checkProjectNameExists(existingProject.teamId, dto.name)
      }

      // 更新项目信息
      const updatedProject = await this.prisma.project.update({
        where: { id: projectId },
        data: {
          ...(dto.name && { name: dto.name }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.icon !== undefined && { icon: dto.icon }),
          ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
        },
      })

      this.logger.log(`用户 ${userId} 更新了项目 ${updatedProject.name} (${projectId})`)

      return updatedProject
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }
      this.logger.error(`更新项目信息失败: ${error.message}`, error.stack)
      throw new HanaException('更新项目信息失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  async deleteProject(projectId: string, userId: string) {
    try {
      const project = await this.projectUtilsService.getProjectById(projectId)

      await this.prisma.$transaction(async (tx) => {
        // 1. 删除 API 分组
        await tx.aPIGroup.updateMany({
          where: {
            projectId,
            status: 'ACTIVE',
          },
          data: {
            status: 'DELETED',
          },
        })

        // 2. 删除 API，并记录操作日志
        const activeApis = await tx.aPI.findMany({
          where: {
            projectId,
            recordStatus: 'ACTIVE',
          },
          select: {
            id: true,
          },
        })

        if (activeApis.length > 0) {
          for (const api of activeApis) {
            await tx.aPIOperationLog.create({
              data: {
                apiId: api.id,
                userId,
                operation: APIOperationType.DELETE,
                versionId: null,
                changes: [VersionChangeType.DELETE],
                description: '项目被删除时软删除 API',
              },
            })
          }

          await tx.aPI.updateMany({
            where: {
              projectId,
              recordStatus: 'ACTIVE',
            },
            data: {
              recordStatus: 'DELETED',
            },
          })
        }

        await tx.recentlyProject.deleteMany({
          where: {
            projectId,
          },
        })

        await tx.project.update({
          where: { id: projectId },
          data: { status: 'DELETED' },
        })
      })

      this.logger.log(
        `用户 ${userId} 删除了项目 ${project.name} (${projectId})，其下 API 分组与 API 已一并软删除`,
      )

      return {
        deletedProjectId: projectId,
      }
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }
      this.logger.error(`删除项目失败: ${error.message}`, error.stack)
      throw new HanaException('删除项目失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  async getRecentlyProjects(userId: string) {
    try {
      const recentlyProjects = await this.prisma.recentlyProject.findMany({
        where: { userId },
        include: {
          project: {
            include: {
              team: true,
            },
          },
        },
        orderBy: { lastVisitedAt: 'desc' },
      })

      return recentlyProjects.map(({ lastVisitedAt, project }) => ({
        ...project,
        lastVisitedAt,
      }))
    }
    catch (error) {
      this.logger.error(`获取最近访问项目失败: ${error.message}`, error.stack)
      throw new HanaException('获取最近访问项目失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  async getUserProjectRole(projectId: string, userId: string) {
    try {
      const membership = await this.prisma.projectMember.findUnique({
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

      if (!membership) {
        throw new HanaException('您不是该项目的成员', ErrorCode.NOT_PROJECT_MEMBER, 403)
      }

      const permissions = membership.role.rolePermissions.map(rp => rp.permission.name)

      return {
        role: membership.role,
        permissions,
      }
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }

      this.logger.error(`获取用户项目角色失败: ${error.message}`, error.stack)
      throw new HanaException('获取用户项目角色失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }
}
