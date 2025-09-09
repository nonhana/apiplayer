import { Injectable, Logger } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { ErrorCode } from '@/common/exceptions/error-code'
import { HanaException } from '@/common/exceptions/hana.exception'
import { RoleName } from '@/constants/role'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { CreateProjectDto } from './dto/create-project.dto'
import { QueryProjectsDto } from './dto/query-projects.dto'
import { UpdateProjectDto } from './dto/update-project.dto'

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name)

  constructor(private readonly prisma: PrismaService) {}

  // ==================== 项目基本管理 ====================

  async createProject(teamId: string, createProjectDto: CreateProjectDto, creatorId: string) {
    const { name, slug, description, icon, isPublic = false } = createProjectDto

    try {
      // 检查用户是否是团队成员
      await this.checkUserTeamMembership(teamId, creatorId)

      // 检查项目名称在团队内是否已存在
      await this.checkProjectNameExists(teamId, name)

      // 检查项目标识符在团队内是否已存在
      await this.checkProjectSlugExists(teamId, slug)

      // 获取项目管理员角色
      const adminRole = await this.prisma.role.findUnique({
        where: { name: RoleName.PROJECT_ADMIN },
      })

      if (!adminRole) {
        throw new HanaException('系统角色配置错误', ErrorCode.ROLE_NOT_FOUND)
      }

      // 使用事务创建项目和成员关系
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
            name: '生产环境',
            type: 'PROD',
            baseUrl: 'https://api.example.com',
            isDefault: true,
          },
        })

        return project
      })

      this.logger.log(`用户 ${creatorId} 在团队 ${teamId} 中创建了项目 ${project.name} (${project.id})`)

      return {
        project,
      }
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }

      this.logger.error(`创建项目失败: ${error.message}`, error.stack)
      throw new HanaException('创建项目失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  async getUserProjects(userId: string, query: QueryProjectsDto) {
    const { page = 1, limit = 10, search, isPublic, teamId } = query

    try {
      const skip = (page - 1) * limit

      // 构建查询条件
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

      // 查询项目列表和总数
      const [projects, total] = await Promise.all([
        this.prisma.project.findMany({
          where: whereCondition,
          include: {
            team: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
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
          team: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  email: true,
                  avatar: true,
                },
              },
              role: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
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

      // 检查用户是否是项目成员
      const currentUserMember = project.members.find(member => member.userId === userId)
      if (!currentUserMember) {
        throw new HanaException('您不是该项目的成员', ErrorCode.NOT_PROJECT_MEMBER, 403)
      }

      // 记录用户访问
      await this.recordUserVisit(userId, projectId)

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

  async updateProject(projectId: string, updateProjectDto: UpdateProjectDto, userId: string) {
    try {
      // 检查项目是否存在
      const existingProject = await this.getProjectById(projectId)

      // 验证用户权限
      await this.checkUserProjectMembership(projectId, userId)

      // 如果要更新名称，检查是否重复
      if (updateProjectDto.name && updateProjectDto.name !== existingProject.name) {
        await this.checkProjectNameExists(existingProject.teamId, updateProjectDto.name)
      }

      // 更新项目信息
      const updatedProject = await this.prisma.project.update({
        where: { id: projectId },
        data: {
          ...(updateProjectDto.name && { name: updateProjectDto.name }),
          ...(updateProjectDto.description !== undefined && { description: updateProjectDto.description }),
          ...(updateProjectDto.icon !== undefined && { icon: updateProjectDto.icon }),
          ...(updateProjectDto.isPublic !== undefined && { isPublic: updateProjectDto.isPublic }),
        },
      })

      this.logger.log(`用户 ${userId} 更新了项目 ${updatedProject.name} (${projectId})`)

      return {
        project: updatedProject,
      }
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
      // 检查项目是否存在
      const project = await this.getProjectById(projectId)

      // 验证用户权限
      await this.checkUserProjectMembership(projectId, userId)

      // 检查项目是否有 API
      const apiCount = await this.prisma.aPI.count({
        where: {
          projectId,
          recordStatus: 'ACTIVE',
        },
      })

      if (apiCount > 0) {
        throw new HanaException('无法删除包含 API 的项目', ErrorCode.CANNOT_DELETE_PROJECT_WITH_APIS)
      }

      // 软删除项目
      await this.prisma.project.update({
        where: { id: projectId },
        data: { status: 'DELETED' },
      })

      this.logger.log(`用户 ${userId} 删除了项目 ${project.name} (${projectId})`)

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

  async getRecentlyProjects(userId: string, limit: number = 10) {
    try {
      const recentlyProjects = await this.prisma.recentlyProject.findMany({
        where: { userId },
        include: {
          project: {
            include: {
              team: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
        orderBy: { lastVisitedAt: 'desc' },
        take: limit,
      })

      return {
        projects: recentlyProjects,
        total: recentlyProjects.length,
      }
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

  // ==================== 私有辅助方法 ====================

  private async checkProjectNameExists(teamId: string, name: string) {
    const existingProject = await this.prisma.project.findFirst({
      where: {
        teamId,
        name,
        status: 'ACTIVE',
      },
    })

    if (existingProject) {
      throw new HanaException('项目名称已存在', ErrorCode.PROJECT_NAME_EXISTS)
    }
  }

  private async checkProjectSlugExists(teamId: string, slug: string) {
    const existingProject = await this.prisma.project.findUnique({
      where: {
        teamId_slug: {
          teamId,
          slug,
        },
      },
    })

    if (existingProject) {
      throw new HanaException('项目标识符已存在', ErrorCode.PROJECT_SLUG_EXISTS)
    }
  }

  private async getProjectById(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new HanaException('项目不存在', ErrorCode.PROJECT_NOT_FOUND, 404)
    }

    if (project.status !== 'ACTIVE') {
      throw new HanaException('项目已被删除', ErrorCode.PROJECT_DELETED)
    }

    return project
  }

  private async checkUserTeamMembership(teamId: string, userId: string) {
    const membership = await this.prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    })

    if (!membership) {
      throw new HanaException('您不是该团队的成员', ErrorCode.NOT_TEAM_MEMBER, 403)
    }
  }

  private async checkUserProjectMembership(projectId: string, userId: string) {
    const membership = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    })

    if (!membership) {
      throw new HanaException('您不是该项目的成员', ErrorCode.NOT_PROJECT_MEMBER, 403)
    }
  }

  private async recordUserVisit(userId: string, projectId: string) {
    try {
      await this.prisma.recentlyProject.upsert({
        where: {
          userId_projectId: {
            userId,
            projectId,
          },
        },
        update: {
          lastVisitedAt: new Date(),
        },
        create: {
          userId,
          projectId,
          lastVisitedAt: new Date(),
        },
      })
    }
    catch (error) {
      // 记录访问失败不影响主要功能
      this.logger.warn(`记录用户访问失败: ${error.message}`)
    }
  }
}
