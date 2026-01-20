import { SystemConfigKey } from '@apiplayer/shared'
import { Injectable, Logger } from '@nestjs/common'
import { APIOperationType, Prisma, VersionChangeType } from 'prisma/generated/client'
import { HanaException } from '@/common/exceptions/hana.exception'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { SystemConfigService } from '@/infra/system-config/system-config.service'
import { ProjectUtilsService } from '@/project/utils.service'
import { CreateVersionReqDto, PublishVersionReqDto } from './dto'
import { ApiUtilsService } from './utils.service'

@Injectable()
export class VersionService {
  private readonly logger = new Logger(VersionService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly projectUtilsService: ProjectUtilsService,
    private readonly apiUtilsService: ApiUtilsService,
    private readonly systemConfigService: SystemConfigService,
  ) {}

  /** 获取指定 API 的版本列表 */
  async getVersionList(apiId: string, projectId: string, userId: string) {
    try {
      await this.projectUtilsService.getProjectById(projectId)

      const api = await this.prisma.aPI.findUnique({
        where: { id: apiId, projectId, recordStatus: 'ACTIVE' },
      })

      if (!api) {
        throw new HanaException('API_NOT_FOUND')
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
        throw new HanaException('API_NOT_FOUND')
      }

      throw new HanaException('INTERNAL_SERVER_ERROR')
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

      const api = await this.prisma.aPI.findUnique({
        where: { id: apiId, projectId, recordStatus: 'ACTIVE' },
      })

      if (!api) {
        throw new HanaException('API_NOT_FOUND')
      }

      const version = await this.prisma.aPIVersion.findUnique({
        where: { id: versionId, apiId, projectId },
        include: { snapshot: true },
      })

      if (!version) {
        throw new HanaException('API_VERSION_NOT_FOUND')
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
        throw new HanaException('API_VERSION_NOT_FOUND')
      }

      throw new HanaException('INTERNAL_SERVER_ERROR')
    }
  }

  /** 创建草稿版本（自动递增 revision，不设置版本号） */
  async createDraftVersion(
    dto: CreateVersionReqDto,
    apiId: string,
    projectId: string,
    userId: string,
  ) {
    try {
      await this.projectUtilsService.getProjectById(projectId)

      const api = await this.prisma.aPI.findUnique({
        where: { id: apiId, projectId, recordStatus: 'ACTIVE' },
        include: { currentVersion: { include: { snapshot: true } } },
      })

      if (!api) {
        throw new HanaException('API_NOT_FOUND')
      }

      // 开启事务
      const result = await this.prisma.$transaction(async (tx) => {
        // 1. 获取当前 API 的最大 revision 号
        const maxRevisionResult = await tx.aPIVersion.aggregate({
          where: { apiId },
          _max: { revision: true },
        })
        const nextRevision = (maxRevisionResult._max.revision ?? 0) + 1

        const changes: VersionChangeType[] = dto.versionInfo?.changes ?? []

        // 2. 创建版本（不设置 version，仅使用 revision）
        const version = await tx.aPIVersion.create({
          data: {
            apiId,
            projectId,
            revision: nextRevision,
            version: null, // 用户发布时填写
            status: 'DRAFT',
            summary: dto.versionInfo?.summary,
            changelog: dto.versionInfo?.changelog,
            changes,
            editorId: userId,
          },
        })

        // 3. 创建快照
        // 合并逻辑：DTO > API Current Snapshot > API Base Info (fallback)
        const prevSnap = api.currentVersion?.snapshot

        await tx.aPISnapshot.create({
          data: {
            versionId: version.id,
            // Base Info: DTO -> 从 API 对应记录中获取
            name: dto.baseInfo?.name ?? api.name,
            method: dto.baseInfo?.method ?? api.method,
            path: dto.baseInfo?.path ?? api.path,
            tags: dto.baseInfo?.tags ?? api.tags,
            sortOrder: dto.baseInfo?.sortOrder ?? api.sortOrder,

            // Snapshot 特定字段
            description: dto.baseInfo?.description ?? prevSnap?.description ?? undefined,
            status: 'DRAFT',

            // Core Info: DTO -> 从旧快照中获取 -> 默认值
            requestHeaders: dto.coreInfo?.requestHeaders ?? prevSnap?.requestHeaders ?? [],
            pathParams: dto.coreInfo?.pathParams ?? prevSnap?.pathParams ?? [],
            queryParams: dto.coreInfo?.queryParams ?? prevSnap?.queryParams ?? [],
            requestBody: dto.coreInfo?.requestBody ?? prevSnap?.requestBody ?? undefined,
            responses: dto.coreInfo?.responses ?? prevSnap?.responses ?? [],
            examples: dto.coreInfo?.examples ?? prevSnap?.examples ?? {},
            mockConfig: dto.coreInfo?.mockConfig ?? prevSnap?.mockConfig ?? undefined,
          },
        })

        await this.apiUtilsService.createOperationLog(
          {
            apiId,
            userId,
            operation: APIOperationType.UPDATE,
            versionId: version.id,
            changes,
            description: dto.versionInfo?.summary ?? '创建草稿版本',
          },
          tx,
        )

        // 4. 清理超出限制的旧版本（仅针对 ARCHIVED 状态的版本）
        const maxRevisions = this.systemConfigService.get<number>(SystemConfigKey.API_MAX_REVISIONS)
        const totalVersions = await tx.aPIVersion.count({ where: { apiId } })

        if (totalVersions > maxRevisions) {
          // 删除最旧的归档版本（按 revision 升序排列）
          const toDeleteCount = totalVersions - maxRevisions
          const oldestVersions = await tx.aPIVersion.findMany({
            where: { apiId, status: 'ARCHIVED' },
            orderBy: { revision: 'asc' },
            take: toDeleteCount,
            select: { id: true },
          })

          if (oldestVersions.length > 0) {
            await tx.aPIVersion.deleteMany({
              where: { id: { in: oldestVersions.map(v => v.id) } },
            })
            this.logger.log(`清理了 API ${apiId} 的 ${oldestVersions.length} 个旧版本`)
          }
        }

        // 5. 不更新 API.currentVersionId
        return tx.aPIVersion.findUnique({
          where: { id: version.id },
          include: { snapshot: true },
        })
      })

      this.logger.log(
        `用户 ${userId} 为项目 ${projectId} 的 API ${apiId} 创建了草稿版本 #${result!.revision}`,
      )

      return result!
    }
    catch (error) {
      if (error instanceof HanaException)
        throw error
      this.logger.error(`创建草稿版本失败: ${error.message}`, error.stack)
      if ((error as Prisma.PrismaClientKnownRequestError).code === 'P2002') {
        throw new HanaException('API_VERSION_EXISTS')
      }
      throw new HanaException('INTERNAL_SERVER_ERROR')
    }
  }

  /** 发布版本（用户填写版本号） */
  async publishVersion(
    dto: PublishVersionReqDto,
    apiId: string,
    versionId: string,
    projectId: string,
    userId: string,
  ) {
    try {
      await this.projectUtilsService.getProjectById(projectId)

      const api = await this.prisma.aPI.findUnique({
        where: { id: apiId, projectId, recordStatus: 'ACTIVE' },
      })
      if (!api) {
        throw new HanaException('API_NOT_FOUND')
      }

      // 检查目标版本
      const targetVersion = await this.prisma.aPIVersion.findUnique({
        where: { id: versionId, apiId, projectId },
        include: { snapshot: true },
      })

      if (!targetVersion) {
        throw new HanaException('API_VERSION_NOT_FOUND')
      }

      // 检查版本号是否已存在
      const existingVersion = await this.prisma.aPIVersion.findFirst({
        where: {
          apiId,
          version: dto.version,
          id: { not: versionId }, // 排除自己
        },
      })
      if (existingVersion) {
        throw new HanaException('API_VERSION_EXISTS')
      }

      // 开启事务
      await this.prisma.$transaction(async (tx) => {
        // 1. 将当前版本归档
        if (api.currentVersionId && api.currentVersionId !== versionId) {
          await tx.aPIVersion.update({
            where: { id: api.currentVersionId },
            data: { status: 'ARCHIVED' },
          })
        }

        // 2. 目标版本设为 CURRENT，填入用户指定的版本号
        await tx.aPIVersion.update({
          where: { id: versionId },
          data: {
            version: dto.version,
            summary: dto.summary ?? targetVersion.summary,
            changelog: dto.changelog ?? targetVersion.changelog,
            status: 'CURRENT',
            publishedAt: new Date(),
            editorId: userId,
          },
        })

        // 3. 更新 API 指向及同步快照信息到 API 主表
        const snap = targetVersion.snapshot!
        await tx.aPI.update({
          where: { id: apiId },
          data: {
            currentVersionId: versionId,
            updatedAt: new Date(),
            editorId: userId,
            // 同步 API 基本信息
            ...(snap && {
              name: snap.name,
              method: snap.method,
              path: snap.path,
              tags: snap.tags,
              sortOrder: snap.sortOrder,
            }),
          },
        })

        await this.apiUtilsService.createOperationLog(
          {
            apiId,
            userId,
            operation: APIOperationType.PUBLISH,
            versionId,
            changes: targetVersion.changes,
            description: dto.summary ?? targetVersion.summary ?? '发布版本',
          },
          tx,
        )
      })

      this.logger.log(
        `用户 ${userId} 发布了项目 ${projectId} 的 API ${apiId} 版本 ${dto.version}`,
      )
    }
    catch (error) {
      if (error instanceof HanaException)
        throw error
      this.logger.error(`发布版本失败: ${error.message}`, error.stack)
      if ((error as Prisma.PrismaClientKnownRequestError).code === 'P2002') {
        // 主要是 API path&method 冲突或版本号冲突
        throw new HanaException('API_PATH_METHOD_CONFLICT')
      }
      throw new HanaException('INTERNAL_SERVER_ERROR')
    }
  }

  /** 归档指定版本 */
  async archiveVersion(
    apiId: string,
    versionId: string,
    projectId: string,
    userId: string,
  ): Promise<void> {
    try {
      await this.projectUtilsService.getProjectById(projectId)

      const version = await this.prisma.aPIVersion.findUnique({
        where: { id: versionId, apiId, projectId },
      })

      if (!version) {
        throw new HanaException('API_VERSION_NOT_FOUND')
      }

      // 如果已归档则跳过
      if (version.status === 'ARCHIVED') {
        this.logger.log(
          `用户 ${userId} 尝试归档已归档版本 ${versionId}（API: ${apiId}, 项目: ${projectId}），跳过`,
        )
        return
      }

      await this.prisma.aPIVersion.update({
        where: { id: versionId },
        data: { status: 'ARCHIVED' },
      })

      this.logger.log(
        `用户 ${userId} 归档了项目 ${projectId} 中 API ${apiId} 的版本 ${version.version}`,
      )

      await this.apiUtilsService.createOperationLog({
        apiId,
        userId,
        operation: APIOperationType.ARCHIVE,
        versionId,
        changes: version.changes,
        description: version.summary ?? '归档版本',
      })
    }
    catch (error) {
      if (error instanceof HanaException)
        throw error

      this.logger.error(`归档版本失败: ${error.message}`, error.stack)

      if ((error as Prisma.PrismaClientKnownRequestError).code === 'P2025') {
        throw new HanaException('API_VERSION_NOT_FOUND')
      }

      throw new HanaException('INTERNAL_SERVER_ERROR')
    }
  }

  /** 回滚到指定历史版本 */
  async rollbackToVersion(
    apiId: string,
    versionId: string,
    projectId: string,
    userId: string,
  ): Promise<void> {
    try {
      await this.projectUtilsService.getProjectById(projectId)

      const api = await this.prisma.aPI.findUnique({
        where: { id: apiId, projectId, recordStatus: 'ACTIVE' },
        include: { currentVersion: { include: { snapshot: true } } },
      })

      if (!api) {
        throw new HanaException('API_NOT_FOUND')
      }

      const targetVersion = await this.prisma.aPIVersion.findUnique({
        where: { id: versionId, apiId, projectId },
        include: { snapshot: true },
      })

      if (!targetVersion) {
        throw new HanaException('API_VERSION_NOT_FOUND')
      }

      if (!targetVersion.snapshot) {
        throw new HanaException('INTERNAL_SERVER_ERROR')
      }

      if (targetVersion.status === 'DRAFT') {
        throw new HanaException('INVALID_PARAMS')
      }

      await this.prisma.$transaction(async (tx) => {
        // 1. 获取下一个 revision 号
        const maxRevisionResult = await tx.aPIVersion.aggregate({
          where: { apiId },
          _max: { revision: true },
        })
        const nextRevision = (maxRevisionResult._max.revision ?? 0) + 1

        // 2. 创建新的 CURRENT 版本，标记为 RESTORE（不设置版本号，需要用户发布时填写）
        const targetVersionLabel = targetVersion.version ?? `#${targetVersion.revision}`
        const newVersion = await tx.aPIVersion.create({
          data: {
            apiId,
            projectId,
            revision: nextRevision,
            version: null, // 回滚后需要用户重新发布填写版本号
            status: 'DRAFT', // 回滚后是草稿状态，需要用户确认发布
            summary: targetVersion.summary ?? `回滚到 ${targetVersionLabel}`,
            changelog: targetVersion.changelog ?? `从版本 ${targetVersionLabel} 回滚`,
            changes: [VersionChangeType.RESTORE],
            editorId: userId,
          },
        })

        const snap = targetVersion.snapshot!

        // 3. 基于目标版本快照复制一份新的快照
        await tx.aPISnapshot.create({
          data: {
            versionId: newVersion.id,
            name: snap.name,
            description: snap.description ?? undefined,
            method: snap.method,
            status: snap.status,
            path: snap.path,
            tags: snap.tags,
            sortOrder: snap.sortOrder,
            requestHeaders: snap.requestHeaders as any,
            pathParams: snap.pathParams ?? [],
            queryParams: snap.queryParams ?? [],
            requestBody: snap.requestBody ?? undefined,
            responses: snap.responses ?? [],
            examples: snap.examples ?? undefined,
            mockConfig: snap.mockConfig ?? undefined,
          },
        })

        // 4. 记录操作日志（回滚仅创建草稿，不更新 API 指向，需要用户发布后生效）
        await this.apiUtilsService.createOperationLog(
          {
            apiId,
            userId,
            operation: APIOperationType.RESTORE,
            versionId: newVersion.id,
            changes: [VersionChangeType.RESTORE],
            description: `回滚到版本 ${targetVersion.version}`,
            metadata: {
              fromVersionId: versionId,
              previousVersionId: api.currentVersion?.id ?? null,
            },
          },
          tx,
        )
      })

      this.logger.log(
        `用户 ${userId} 将项目 ${projectId} 中 API ${apiId} 回滚到版本 ${versionId}`,
      )
    }
    catch (error) {
      if (error instanceof HanaException)
        throw error

      this.logger.error(`回滚到指定版本失败: ${error.message}`, error.stack)

      if ((error as Prisma.PrismaClientKnownRequestError).code === 'P2025') {
        throw new HanaException('API_VERSION_NOT_FOUND')
      }

      if ((error as Prisma.PrismaClientKnownRequestError).code === 'P2002') {
        throw new HanaException('API_VERSION_EXISTS')
      }

      throw new HanaException('INTERNAL_SERVER_ERROR')
    }
  }

  /** 比较两个版本 */
  async compareVersions(
    apiId: string,
    fromVersionId: string,
    toVersionId: string,
    projectId: string,
    userId: string,
  ) {
    try {
      await this.projectUtilsService.getProjectById(projectId)

      if (fromVersionId === toVersionId) {
        throw new HanaException('INVALID_PARAMS')
      }

      const api = await this.prisma.aPI.findUnique({
        where: { id: apiId, projectId, recordStatus: 'ACTIVE' },
      })

      if (!api) {
        throw new HanaException('API_NOT_FOUND')
      }

      const versions = await this.prisma.aPIVersion.findMany({
        where: {
          apiId,
          projectId,
          id: { in: [fromVersionId, toVersionId] },
        },
        include: { snapshot: true },
      })

      if (versions.length !== 2) {
        throw new HanaException('API_VERSION_NOT_FOUND')
      }

      const fromVersion = versions.find(v => v.id === fromVersionId)!
      const toVersion = versions.find(v => v.id === toVersionId)!

      // 优先读取缓存的比较结果
      let cached = await this.prisma.aPIVersionComparison.findUnique({
        where: {
          fromVersionId_toVersionId: {
            fromVersionId,
            toVersionId,
          },
        },
      })

      if (!cached) {
        const diffData = this.apiUtilsService.buildVersionDiff(fromVersion.snapshot, toVersion.snapshot)

        cached = await this.prisma.aPIVersionComparison.create({
          data: {
            fromVersionId,
            toVersionId,
            diffData,
          },
        })
      }

      this.logger.log(
        `用户 ${userId} 比较了项目 ${projectId} 中 API ${apiId} 的版本 ${fromVersionId} 与 ${toVersionId}`,
      )

      return {
        from: fromVersion,
        to: toVersion,
        diff: cached.diffData,
      }
    }
    catch (error) {
      if (error instanceof HanaException)
        throw error

      this.logger.error(`比较版本失败: ${error.message}`, error.stack)

      if ((error as Prisma.PrismaClientKnownRequestError).code === 'P2025') {
        throw new HanaException('API_VERSION_NOT_FOUND')
      }

      throw new HanaException('INTERNAL_SERVER_ERROR')
    }
  }
}
