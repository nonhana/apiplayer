import { Injectable, Logger } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { ErrorCode } from '@/common/exceptions/error-code'
import { HanaException } from '@/common/exceptions/hana.exception'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { ProjectUtilsService } from '@/project/utils.service'

@Injectable()
export class VersionService {
  private readonly logger = new Logger(VersionService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly projectUtilsService: ProjectUtilsService,
  ) {}

  /** 获取指定 API 的版本列表 */
  async getVersionList(apiId: string, projectId: string, userId: string) {
    try {
      await this.projectUtilsService.getProjectById(projectId)
      await this.projectUtilsService.checkUserProjectMembership(projectId, userId)

      const api = await this.prisma.aPI.findUnique({
        where: { id: apiId, projectId, recordStatus: 'ACTIVE' },
      })

      if (!api) {
        throw new HanaException('API 不存在', ErrorCode.API_NOT_FOUND, 404)
      }

      const versions = await this.prisma.aPIVersion.findMany({
        where: {
          apiId,
          projectId,
        },
        include: {
          snapshot: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      this.logger.log(`用户 ${userId} 获取了项目 ${projectId} 中 API ${apiId} 的版本列表`)

      return { versions }
    }
    catch (error) {
      if (error instanceof HanaException)
        throw error

      this.logger.error(`获取版本列表失败: ${error.message}`, error.stack)

      if ((error as Prisma.PrismaClientKnownRequestError).code === 'P2025') {
        throw new HanaException('API 不存在', ErrorCode.API_NOT_FOUND, 404)
      }

      throw new HanaException(
        '获取版本列表失败',
        ErrorCode.INTERNAL_SERVER_ERROR,
        500,
      )
    }
  }

  /** 获取指定版本详情（含快照） */
  async getVersionDetail(
    apiId: string,
    versionId: string,
    projectId: string,
    userId: string,
  ) {
    try {
      await this.projectUtilsService.getProjectById(projectId)
      await this.projectUtilsService.checkUserProjectMembership(projectId, userId)

      const api = await this.prisma.aPI.findUnique({
        where: { id: apiId, projectId, recordStatus: 'ACTIVE' },
      })

      if (!api) {
        throw new HanaException('API 不存在', ErrorCode.API_NOT_FOUND, 404)
      }

      const version = await this.prisma.aPIVersion.findUnique({
        where: { id: versionId, apiId, projectId },
        include: { snapshot: true },
      })

      if (!version) {
        throw new HanaException('API 版本不存在', ErrorCode.API_VERSION_NOT_FOUND, 404)
      }

      this.logger.log(
        `用户 ${userId} 获取了项目 ${projectId} 中 API ${apiId} 的版本 ${versionId} 详情`,
      )

      return version
    }
    catch (error) {
      if (error instanceof HanaException)
        throw error

      this.logger.error(`获取版本详情失败: ${error.message}`, error.stack)

      if ((error as Prisma.PrismaClientKnownRequestError).code === 'P2025') {
        throw new HanaException('API 版本不存在', ErrorCode.API_VERSION_NOT_FOUND, 404)
      }

      throw new HanaException(
        '获取版本详情失败',
        ErrorCode.INTERNAL_SERVER_ERROR,
        500,
      )
    }
  }
}
