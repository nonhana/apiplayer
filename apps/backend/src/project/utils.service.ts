import { Injectable, Logger } from '@nestjs/common'
import { HanaException } from '@/common/exceptions/hana.exception'
import { PrismaService } from '@/infra/prisma/prisma.service'

@Injectable()
export class ProjectUtilsService {
  private readonly logger = new Logger(ProjectUtilsService.name)

  constructor(private readonly prisma: PrismaService) {}

  /** 检查在 team 中是否存在同名的项目 */
  async checkProjectNameExists(teamId: string, name: string) {
    const existingProject = await this.prisma.project.findFirst({
      where: {
        teamId,
        name,
        status: 'ACTIVE',
      },
    })

    if (existingProject) {
      throw new HanaException('PROJECT_NAME_EXISTS')
    }
  }

  /** 检查在 team 中是否存在同名的项目 */
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
      throw new HanaException('PROJECT_SLUG_EXISTS')
    }
  }

  /** 检查当前 ID 的项目是否有效 */
  async getProjectById(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new HanaException('PROJECT_NOT_FOUND')
    }

    if (project.status !== 'ACTIVE') {
      throw new HanaException('PROJECT_DELETED')
    }

    return project
  }

  /** 添加用户访问项目记录 */
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
