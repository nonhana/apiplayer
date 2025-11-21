import { Injectable, Logger } from '@nestjs/common'
import { APIOperationType, Prisma, VersionChangeType } from '@prisma/client'
import { ErrorCode } from '@/common/exceptions/error-code'
import { HanaException } from '@/common/exceptions/hana.exception'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { ProjectUtilsService } from '@/project/utils.service'
import { CreateVersionReqDto } from './dto/create-version.dto'
import { ApiUtilsService } from './utils.service'

@Injectable()
export class VersionService {
  private readonly logger = new Logger(VersionService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly projectUtilsService: ProjectUtilsService,
    private readonly apiUtilsService: ApiUtilsService,
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

  /** 创建草稿版本 */
  async createDraftVersion(
    dto: CreateVersionReqDto,
    apiId: string,
    projectId: string,
    userId: string,
  ) {
    try {
      await this.projectUtilsService.getProjectById(projectId)
      await this.projectUtilsService.checkUserProjectMembership(projectId, userId)

      const api = await this.prisma.aPI.findUnique({
        where: { id: apiId, projectId, recordStatus: 'ACTIVE' },
        include: { currentVersion: { include: { snapshot: true } } },
      })

      if (!api) {
        throw new HanaException('API 不存在', ErrorCode.API_NOT_FOUND, 404)
      }

      // 开启事务
      const result = await this.prisma.$transaction(async (tx) => {
        // 1. 创建版本
        let versionStr = dto.versionInfo?.version
        if (!versionStr) {
          versionStr = this.apiUtilsService.genNextVersion(api.currentVersion?.version)
        }

        const changes: VersionChangeType[] = dto.versionInfo?.changes ?? []

        const version = await tx.aPIVersion.create({
          data: {
            apiId,
            projectId,
            version: versionStr,
            status: 'DRAFT',
            summary: dto.versionInfo?.summary,
            changelog: dto.versionInfo?.changelog,
            changes,
            editorId: userId,
          },
        })

        // 2. 创建快照
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

        // 3. 不更新 API.currentVersionId
        return tx.aPIVersion.findUnique({
          where: { id: version.id },
          include: { snapshot: true },
        })
      })

      this.logger.log(
        `用户 ${userId} 为项目 ${projectId} 的 API ${apiId} 创建了草稿版本 ${result!.version}`,
      )

      return result!
    }
    catch (error) {
      if (error instanceof HanaException)
        throw error
      this.logger.error(`创建草稿版本失败: ${error.message}`, error.stack)
      if ((error as Prisma.PrismaClientKnownRequestError).code === 'P2002') {
        throw new HanaException(
          '该版本号已存在',
          ErrorCode.INVALID_PARAMS,
          400,
        )
      }
      throw new HanaException(
        '创建草稿版本失败',
        ErrorCode.INTERNAL_SERVER_ERROR,
        500,
      )
    }
  }

  /** 发布版本 */
  async publishVersion(
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

      // 检查目标版本
      const targetVersion = await this.prisma.aPIVersion.findUnique({
        where: { id: versionId, apiId, projectId },
        include: { snapshot: true },
      })

      if (!targetVersion) {
        throw new HanaException('目标版本不存在', ErrorCode.API_VERSION_NOT_FOUND, 404)
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

        // 2. 目标版本设为 CURRENT
        await tx.aPIVersion.update({
          where: { id: versionId },
          data: {
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
            description: targetVersion.summary ?? '发布版本',
          },
          tx,
        )
      })

      this.logger.log(
        `用户 ${userId} 发布了项目 ${projectId} 的 API ${apiId} 版本 ${targetVersion.version}`,
      )
    }
    catch (error) {
      if (error instanceof HanaException)
        throw error
      this.logger.error(`发布版本失败: ${error.message}`, error.stack)
      if ((error as Prisma.PrismaClientKnownRequestError).code === 'P2002') {
        // 主要是 API path&method 冲突，每个 API 的 path&method 是唯一的
        throw new HanaException(
          '发布失败：同一路径与方法的 API 已存在',
          ErrorCode.API_PATH_METHOD_CONFLICT,
          400,
        )
      }
      throw new HanaException(
        '发布版本失败',
        ErrorCode.INTERNAL_SERVER_ERROR,
        500,
      )
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
      await this.projectUtilsService.checkUserProjectMembership(projectId, userId)

      const version = await this.prisma.aPIVersion.findUnique({
        where: { id: versionId, apiId, projectId },
      })

      if (!version) {
        throw new HanaException('API 版本不存在', ErrorCode.API_VERSION_NOT_FOUND, 404)
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
        throw new HanaException('API 版本不存在', ErrorCode.API_VERSION_NOT_FOUND, 404)
      }

      throw new HanaException(
        '归档版本失败',
        ErrorCode.INTERNAL_SERVER_ERROR,
        500,
      )
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
      await this.projectUtilsService.checkUserProjectMembership(projectId, userId)

      const api = await this.prisma.aPI.findUnique({
        where: { id: apiId, projectId, recordStatus: 'ACTIVE' },
        include: { currentVersion: { include: { snapshot: true } } },
      })

      if (!api) {
        throw new HanaException('API 不存在', ErrorCode.API_NOT_FOUND, 404)
      }

      const targetVersion = await this.prisma.aPIVersion.findUnique({
        where: { id: versionId, apiId, projectId },
        include: { snapshot: true },
      })

      if (!targetVersion) {
        throw new HanaException('目标版本不存在', ErrorCode.API_VERSION_NOT_FOUND, 404)
      }

      if (!targetVersion.snapshot) {
        throw new HanaException(
          '目标版本缺少快照数据，无法回滚',
          ErrorCode.INTERNAL_SERVER_ERROR,
          500,
        )
      }

      if (targetVersion.status === 'DRAFT') {
        throw new HanaException(
          '不能回滚到草稿版本，请先发布该版本',
          ErrorCode.INVALID_PARAMS,
          400,
        )
      }

      await this.prisma.$transaction(async (tx) => {
        // 1. 基于当前版本号生成新的版本号
        const prevVersion = api.currentVersion?.version
        const newVersionStr = this.apiUtilsService.genNextVersion(prevVersion)

        // 2. 创建新的 CURRENT 版本，标记为 RESTORE
        const newVersion = await tx.aPIVersion.create({
          data: {
            apiId,
            projectId,
            version: newVersionStr,
            status: 'CURRENT',
            summary: targetVersion.summary ?? `Rollback to ${targetVersion.version}`,
            changelog: targetVersion.changelog ?? `Rollback to version ${targetVersion.version}`,
            changes: [VersionChangeType.RESTORE],
            editorId: userId,
            publishedAt: new Date(),
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

        // 4. 更新 API 指向新的 CURRENT 版本，并同步基础字段
        await tx.aPI.update({
          where: { id: apiId },
          data: {
            currentVersionId: newVersion.id,
            updatedAt: new Date(),
            editorId: userId,
            name: snap.name,
            method: snap.method,
            path: snap.path,
            tags: snap.tags,
            sortOrder: snap.sortOrder,
          },
        })

        // 5. 将旧的 CURRENT 版本标记为 ARCHIVED
        if (api.currentVersion?.id) {
          await tx.aPIVersion.update({
            where: { id: api.currentVersion.id },
            data: { status: 'ARCHIVED' },
          })
        }

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
        throw new HanaException('API 或版本不存在', ErrorCode.API_VERSION_NOT_FOUND, 404)
      }

      if ((error as Prisma.PrismaClientKnownRequestError).code === 'P2002') {
        throw new HanaException(
          '创建回滚版本失败：生成的版本号已存在',
          ErrorCode.API_VERSION_EXISTS,
          400,
        )
      }

      throw new HanaException(
        '回滚到指定版本失败',
        ErrorCode.INTERNAL_SERVER_ERROR,
        500,
      )
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
      await this.projectUtilsService.checkUserProjectMembership(projectId, userId)

      if (fromVersionId === toVersionId) {
        throw new HanaException(
          '不能比较同一个版本',
          ErrorCode.INVALID_PARAMS,
          400,
        )
      }

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
          id: { in: [fromVersionId, toVersionId] },
        },
        include: { snapshot: true },
      })

      if (versions.length !== 2) {
        throw new HanaException(
          '待比较的版本不存在或不属于当前 API',
          ErrorCode.API_VERSION_NOT_FOUND,
          404,
        )
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
        throw new HanaException('API 版本不存在', ErrorCode.API_VERSION_NOT_FOUND, 404)
      }

      throw new HanaException(
        '比较版本失败',
        ErrorCode.INTERNAL_SERVER_ERROR,
        500,
      )
    }
  }
}
