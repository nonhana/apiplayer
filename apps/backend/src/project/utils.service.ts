import { Injectable, Logger } from '@nestjs/common'
import { ErrorCode } from '@/common/exceptions/error-code'
import { HanaException } from '@/common/exceptions/hana.exception'
import { PrismaService } from '@/infra/prisma/prisma.service'

@Injectable()
export class ProjectUtilsService {
  private readonly logger = new Logger(ProjectUtilsService.name)

  constructor(private readonly prisma: PrismaService) {}

  async checkProjectNameExists(teamId: string, name: string) {
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

  async checkProjectSlugExists(teamId: string, slug: string) {
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

  async getProjectById(projectId: string) {
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

  async checkUserTeamMembership(teamId: string, userId: string) {
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

  async checkUserProjectMembership(projectId: string, userId: string) {
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

  async recordUserVisit(userId: string, projectId: string) {
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
