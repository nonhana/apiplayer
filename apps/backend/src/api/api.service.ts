import { SystemConfigKey } from '@apiplayer/shared'
import { Injectable, Logger } from '@nestjs/common'
import { APIOperationType, Prisma, VersionChangeType } from 'prisma/generated/client'
import { HanaException } from '@/common/exceptions/hana.exception'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { SystemConfigService } from '@/infra/system-config/system-config.service'
import { ProjectUtilsService } from '@/project/utils.service'
import { UtilService } from '@/util/util.service'
import {
  CloneApiReqDto,
  CreateApiReqDto,
  GetApiOperationLogsReqDto,
  GetApisReqDto,
  SortItemsReqDto,
  UpdateApiReqDto,
} from './dto'
import { ApiUtilsService } from './utils.service'

@Injectable()
export class ApiService {
  private readonly logger = new Logger(ApiService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly projectUtilsService: ProjectUtilsService,
    private readonly apiUtilsService: ApiUtilsService,
    private readonly utilService: UtilService,
    private readonly systemConfigService: SystemConfigService,
  ) {}

  /** 创建 API */
  async createAPI(dto: CreateApiReqDto, projectId: string, userId: string) {
    try {
      await this.projectUtilsService.getProjectById(projectId)
      await this.apiUtilsService.checkApiGroupExists(projectId, dto.groupId)

      // SYSTEM: 检查项目 API 数量是否达到上限
      const projectMaxApis = this.systemConfigService.get<number>(SystemConfigKey.PROJECT_MAX_APIS)
      const projectApis = await this.prisma.aPI.count({
        where: { projectId, recordStatus: 'ACTIVE' },
      })
      if (projectApis >= projectMaxApis) {
        throw new HanaException('PROJECT_API_LIMIT_EXCEEDED')
      }

      const created = await this.prisma.$transaction(async (tx) => {
        const api = await tx.aPI.create({
          data: {
            projectId,
            groupId: dto.groupId,
            name: dto.name,
            method: dto.method,
            path: dto.path,
            tags: dto.tags ?? [],
            sortOrder: dto.sortOrder ?? 0, // 一般来说，创建新的 API 会放在最后，由前端处理排序
            ownerId: dto.ownerId ?? null,
            editorId: userId,
            creatorId: userId,
          },
        })

        const version = await tx.aPIVersion.create({
          data: {
            apiId: api.id,
            projectId,
            revision: 1, // 首个版本，revision 从 1 开始
            version: null, // 用户发布时填写版本号
            status: 'DRAFT',
            summary: dto.summary,
            editorId: userId,
            changes: [VersionChangeType.CREATE],
          },
        })

        await tx.aPISnapshot.create({
          data: {
            versionId: version.id,
            // base info
            name: api.name,
            description: dto.description,
            method: api.method,
            status: dto.status ?? 'DRAFT',
            path: api.path,
            tags: api.tags,
            sortOrder: api.sortOrder,
            // core info
            requestHeaders: dto.requestHeaders ?? [],
            pathParams: dto.pathParams ?? [],
            queryParams: dto.queryParams ?? [],
            requestBody: dto.requestBody ?? undefined,
            responses: dto.responses ?? [],
            examples: dto.examples ?? {},
            mockConfig: dto.mockConfig ?? undefined,
          },
        })

        await tx.aPI.update({
          where: { id: api.id },
          data: { currentVersionId: version.id },
        })

        await this.apiUtilsService.createOperationLog(
          {
            apiId: api.id,
            userId,
            operation: APIOperationType.CREATE,
            versionId: version.id,
            changes: [VersionChangeType.CREATE],
            description: dto.summary ?? '创建 API',
          },
          tx,
        )

        return api
      })

      this.logger.log(
        `用户 ${userId} 在项目 ${projectId} 中创建了 API ${created.name}`,
      )
    }
    catch (error) {
      if (error instanceof HanaException)
        throw error
      this.logger.error(`创建 API 失败: ${error.message}`, error.stack)
      if ((error as Prisma.PrismaClientKnownRequestError).code === 'P2002') {
        throw new HanaException('API_PATH_METHOD_CONFLICT')
      }
      throw new HanaException('INTERNAL_SERVER_ERROR')
    }
  }

  /** 查询 API 列表 */
  async getAPIList(dto: GetApisReqDto, projectId: string) {
    const { page = 1, limit = 10, search, groupId, method, status } = dto

    try {
      await this.projectUtilsService.getProjectById(projectId)

      const whereCondition: Prisma.APIWhereInput = {
        recordStatus: 'ACTIVE',
        projectId,
        ...(groupId && { groupId }),
        ...(method && { method }),
        ...(status && { status }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { path: { contains: search, mode: 'insensitive' } },
          ],
        }),
      }
      const skip = (page - 1) * limit

      // 查询 API 列表和总数
      const [apis, total] = await Promise.all([
        this.prisma.aPI.findMany({
          where: whereCondition,
          skip,
          take: limit,
          orderBy: { updatedAt: 'desc' },
        }),
        this.prisma.aPI.count({ where: whereCondition }),
      ])

      const totalPages = Math.ceil(total / limit)

      return {
        apis,
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
      if (error instanceof HanaException)
        throw error
      this.logger.error(`获取 API 列表失败: ${error.message}`, error.stack)
      throw new HanaException('INTERNAL_SERVER_ERROR')
    }
  }

  /** 获取 API 详情 */
  async getAPIDetail(apiId: string, projectId: string) {
    try {
      await this.projectUtilsService.getProjectById(projectId)

      const api = await this.prisma.aPI.findUnique({
        where: { id: apiId },
        include: {
          group: true,
          currentVersion: { include: { snapshot: true } },
          owner: true,
          editor: true,
          creator: true,
        },
      })

      if (!api || api.projectId !== projectId || api.recordStatus !== 'ACTIVE') {
        throw new HanaException('API_NOT_FOUND')
      }

      return api
    }
    catch (error) {
      if (error instanceof HanaException)
        throw error
      this.logger.error(`获取 API 详情失败: ${error.message}`, error.stack)
      throw new HanaException('INTERNAL_SERVER_ERROR')
    }
  }

  /** 更新 API 信息 */
  async updateAPI(dto: UpdateApiReqDto, apiId: string, projectId: string, userId: string) {
    try {
      // 基础校验
      await this.projectUtilsService.getProjectById(projectId)

      // 获取目标 API
      const api = await this.prisma.aPI.findUnique({
        where: { id: apiId },
        include: { currentVersion: { include: { snapshot: true } } },
      })
      if (!api || api.projectId !== projectId || api.recordStatus !== 'ACTIVE') {
        throw new HanaException('API_NOT_FOUND')
      }

      // 更新流程：
      // 更新基本信息 -> 新建版本 -> 创建快照 -> 切换到新 version -> 归档旧 version -> 返回更新后的 API
      const updated = await this.prisma.$transaction(async (tx) => {
        // 更新 API 基本信息（仅当提供）
        if (dto.baseInfo) {
          await tx.aPI.update({
            where: { id: apiId },
            data: {
              ...(dto.baseInfo.groupId && { groupId: dto.baseInfo.groupId }),
              ...(dto.baseInfo.name && { name: dto.baseInfo.name }),
              ...(dto.baseInfo.method && { method: dto.baseInfo.method }),
              ...(dto.baseInfo.path && { path: dto.baseInfo.path }),
              ...(dto.baseInfo.tags && { tags: dto.baseInfo.tags }),
              ...(dto.baseInfo.sortOrder !== undefined && { sortOrder: dto.baseInfo.sortOrder }),
              ...(dto.baseInfo.ownerId !== undefined && { ownerId: dto.baseInfo.ownerId }),
              editorId: userId,
            },
          })
        }

        // 获取当前 API 的最大 revision 号
        const maxRevisionResult = await tx.aPIVersion.aggregate({
          where: { apiId: api.id },
          _max: { revision: true },
        })
        const nextRevision = (maxRevisionResult._max.revision ?? 0) + 1

        const changes: VersionChangeType[] = dto.versionInfo?.changes?.length
          ? dto.versionInfo.changes
          : [VersionChangeType.BASIC_INFO]

        // 新建版本（DRAFT，用户需要手动发布才能设置版本号）
        const version = await tx.aPIVersion.create({
          data: {
            apiId: api.id,
            projectId,
            revision: nextRevision,
            version: null, // 用户发布时填写版本号
            status: 'DRAFT',
            editorId: userId,
            changes,
            summary: dto.versionInfo?.summary,
            changelog: dto.versionInfo?.changelog,
          },
        })

        // 新建快照信息

        // 为 JSON Schema 添加 examples
        if (dto.coreInfo?.requestBody?.jsonSchema) {
          const schema = dto.coreInfo.requestBody.jsonSchema
          const needUpdate = dto.coreInfo.requestBody.jsonSchema?.schemaChanged as boolean
          if (!schema.examples || !schema.examples.length || needUpdate) {
            const example = await this.utilService.getSchemaMock(schema)
            schema.examples = [example]
          }
        }

        if (dto.coreInfo?.responses) {
          for (const response of dto.coreInfo.responses) {
            if (response.body) {
              const schema = response.body
              const needUpdate = response.body?.schemaChanged as boolean
              if (!schema.examples || !schema.examples.length || needUpdate) {
                const example = await this.utilService.getSchemaMock(schema)
                schema.examples = [example]
              }
            }
          }
        }

        const prevSnap = api.currentVersion?.snapshot
        await tx.aPISnapshot.create({
          data: {
            versionId: version.id,
            // base info
            name: dto.baseInfo?.name ?? api.name,
            method: dto.baseInfo?.method ?? api.method,
            path: dto.baseInfo?.path ?? api.path,
            description: dto.baseInfo?.description ?? prevSnap?.description ?? undefined,
            tags: dto.baseInfo?.tags ?? api.tags,
            status: dto.baseInfo?.status ?? prevSnap?.status ?? 'PUBLISHED',
            sortOrder: dto.baseInfo?.sortOrder ?? api.sortOrder,
            // core info
            requestHeaders: dto.coreInfo?.requestHeaders ?? prevSnap?.requestHeaders ?? [],
            pathParams: dto.coreInfo?.pathParams ?? prevSnap?.pathParams ?? [],
            queryParams: dto.coreInfo?.queryParams ?? prevSnap?.queryParams ?? [],
            requestBody: dto.coreInfo?.requestBody ?? prevSnap?.requestBody ?? undefined,
            responses: dto.coreInfo?.responses ?? prevSnap?.responses ?? [],
            examples: dto.coreInfo?.examples ?? prevSnap?.examples ?? {},
            mockConfig: dto.coreInfo?.mockConfig ?? prevSnap?.mockConfig ?? undefined,
          },
        })

        // 切换 currentVersionId 到最新版本
        await tx.aPI.update({
          where: { id: apiId },
          data: { currentVersionId: version.id },
        })

        // 清理超出限制的旧版本
        const maxRevisions = this.systemConfigService.get<number>(SystemConfigKey.API_MAX_REVISIONS)
        const totalVersions = await tx.aPIVersion.count({ where: { apiId: api.id } })

        if (totalVersions > maxRevisions) {
          const toDeleteCount = totalVersions - maxRevisions
          const oldestVersions = await tx.aPIVersion.findMany({
            where: { apiId: api.id, status: 'ARCHIVED' },
            orderBy: { revision: 'asc' },
            take: toDeleteCount,
            select: { id: true },
          })

          if (oldestVersions.length > 0) {
            await tx.aPIVersion.deleteMany({
              where: { id: { in: oldestVersions.map(v => v.id) } },
            })
          }
        }

        await this.apiUtilsService.createOperationLog(
          {
            apiId: api.id,
            userId,
            operation: APIOperationType.UPDATE,
            versionId: version.id,
            changes,
            description: dto.versionInfo?.summary ?? '更新 API',
          },
          tx,
        )

        // 返回更新后的 API
        return tx.aPI.findUnique({
          where: { id: apiId },
          include: { currentVersion: { include: { snapshot: true } } },
        })
      })

      this.logger.log(`用户 ${userId} 更新了项目 ${projectId} 的 API ${apiId}`)
      return updated
    }
    catch (error) {
      if (error instanceof HanaException)
        throw error
      this.logger.error(`更新 API 失败: ${error.message}`, error.stack)
      if ((error as Prisma.PrismaClientKnownRequestError).code === 'P2002') {
        throw new HanaException('API_PATH_METHOD_CONFLICT')
      }
      throw new HanaException('INTERNAL_SERVER_ERROR')
    }
  }

  /** 删除 API */
  async deleteAPI(apiId: string, projectId: string, userId: string) {
    try {
      await this.projectUtilsService.getProjectById(projectId)

      const api = await this.prisma.aPI.findUnique({ where: { id: apiId } })
      if (!api || api.projectId !== projectId || api.recordStatus !== 'ACTIVE') {
        throw new HanaException('API_NOT_FOUND')
      }

      // 软删除
      await this.prisma.aPI.update({
        where: { id: apiId },
        data: { recordStatus: 'DELETED' },
      })

      await this.apiUtilsService.createOperationLog({
        apiId,
        userId,
        operation: APIOperationType.DELETE,
        changes: [VersionChangeType.DELETE],
        description: '删除 API',
      })

      this.logger.log(`用户 ${userId} 删除了项目 ${projectId} 的 API ${apiId}`)
    }
    catch (error) {
      if (error instanceof HanaException)
        throw error
      this.logger.error(`删除 API 失败: ${error.message}`, error.stack)
      throw new HanaException('INTERNAL_SERVER_ERROR')
    }
  }

  /** 复制 API */
  async cloneAPI(dto: CloneApiReqDto, apiId: string, projectId: string, userId: string) {
    try {
      // 基础校验
      await this.projectUtilsService.getProjectById(projectId)
      await this.apiUtilsService.checkApiGroupExists(projectId, dto.targetGroupId)

      // 获取源 API 及当前版本与快照
      const source = await this.prisma.aPI.findUnique({
        where: { id: apiId },
        include: { currentVersion: { include: { snapshot: true } } },
      })
      if (!source || source.projectId !== projectId || source.recordStatus !== 'ACTIVE') {
        throw new HanaException('API_NOT_FOUND')
      }

      // 目标基础信息（若未提供则沿用源 API）
      const targetName = dto.name ?? source.name
      const targetPath = dto.path ?? source.path
      const targetMethod = dto.method ?? source.method

      // 开启事务：创建新 API -> 创建 DRAFT 版本 -> 复制快照 -> 设置 currentVersionId
      const created = await this.prisma.$transaction(async (tx) => {
        const clonedApi = await tx.aPI.create({
          data: {
            projectId,
            groupId: dto.targetGroupId,
            name: targetName,
            method: targetMethod,
            path: targetPath,
            tags: source.tags ?? [],
            sortOrder: source.sortOrder ?? 0,
            ownerId: source.ownerId ?? null,
            editorId: userId,
            creatorId: userId,
          },
        })

        const version = await tx.aPIVersion.create({
          data: {
            apiId: clonedApi.id,
            projectId,
            revision: 1, // 克隆的 API 首个版本
            version: null, // 用户发布时填写版本号
            status: 'DRAFT',
            summary: source.currentVersion?.summary,
            editorId: userId,
            changes: [VersionChangeType.CREATE],
          },
        })

        const snap = source.currentVersion?.snapshot
        await tx.aPISnapshot.create({
          data: {
            versionId: version.id,
            name: targetName,
            method: targetMethod,
            path: targetPath,
            description: snap?.description ?? undefined,
            tags: clonedApi.tags,
            status: 'DRAFT',
            sortOrder: clonedApi.sortOrder,
            requestHeaders: snap?.requestHeaders ?? [],
            pathParams: snap?.pathParams ?? [],
            queryParams: snap?.queryParams ?? [],
            requestBody: snap?.requestBody ?? undefined,
            responses: snap?.responses ?? [],
            examples: snap?.examples ?? {},
            mockConfig: snap?.mockConfig ?? undefined,
          },
        })

        await tx.aPI.update({
          where: { id: clonedApi.id },
          data: { currentVersionId: version.id },
        })

        await this.apiUtilsService.createOperationLog(
          {
            apiId: clonedApi.id,
            userId,
            operation: APIOperationType.CREATE,
            versionId: version.id,
            changes: [VersionChangeType.CREATE],
            description: '克隆 API',
            metadata: {
              sourceApiId: apiId,
            },
          },
          tx,
        )

        return clonedApi
      })

      this.logger.log(`用户 ${userId} 在项目 ${projectId} 中克隆了 API ${apiId} -> 新 API ${created.id}`)
      return created
    }
    catch (error) {
      if (error instanceof HanaException)
        throw error
      this.logger.error(`复制 API 失败: ${error.message}`, error.stack)
      if ((error as Prisma.PrismaClientKnownRequestError).code === 'P2002') {
        throw new HanaException('API_PATH_METHOD_CONFLICT')
      }
      throw new HanaException('INTERNAL_SERVER_ERROR')
    }
  }

  /** 批量更新 API 排序 */
  async sortAPIs(dto: SortItemsReqDto, projectId: string, userId: string) {
    try {
      await this.projectUtilsService.getProjectById(projectId)

      const ids = dto.items.map(item => item.id)

      const apis = await this.prisma.aPI.findMany({
        where: {
          id: { in: ids },
          projectId,
          recordStatus: 'ACTIVE',
        },
        select: { id: true },
      })

      const validIds = new Set(apis.map(api => api.id))
      for (const id of ids) {
        if (!validIds.has(id)) {
          throw new HanaException('INVALID_PARAMS')
        }
      }

      await this.prisma.$transaction(async (tx) => {
        for (const item of dto.items) {
          await tx.aPI.update({
            where: { id: item.id },
            data: { sortOrder: item.sortOrder },
          })
        }
      })

      this.logger.log(
        `用户 ${userId} 在项目 ${projectId} 中更新了 ${dto.items.length} 个 API 的排序`,
      )
    }
    catch (error) {
      if (error instanceof HanaException)
        throw error
      this.logger.error(`更新 API 排序失败: ${error.message}`, error.stack)
      throw new HanaException('INTERNAL_SERVER_ERROR')
    }
  }

  /** 获取 API 操作日志 */
  async getAPIOperationLogs(
    dto: GetApiOperationLogsReqDto,
    apiId: string,
    projectId: string,
    userId: string,
  ) {
    const {
      page = 1,
      limit = 10,
      operation,
      changes,
      targetUserId,
      startTime,
      endTime,
      search,
    } = dto

    try {
      await this.projectUtilsService.getProjectById(projectId)

      const api = await this.prisma.aPI.findUnique({
        where: { id: apiId, projectId, recordStatus: 'ACTIVE' },
      })

      if (!api) {
        throw new HanaException('API_NOT_FOUND')
      }

      const whereCondition: Prisma.APIOperationLogWhereInput = {
        apiId,
        ...(operation && { operation }),
        ...(targetUserId && { userId: targetUserId }),
        ...(changes && changes.length && { changes: { hasSome: changes } }),
        ...((startTime || endTime) && {
          createdAt: {
            ...(startTime && { gte: startTime }),
            ...(endTime && { lte: endTime }),
          },
        }),
        ...(search && {
          OR: [
            {
              description: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        }),
      }
      const skip = (page - 1) * limit

      const [logs, total] = await Promise.all([
        this.prisma.aPIOperationLog.findMany({
          where: whereCondition,
          include: { user: true },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.aPIOperationLog.count({ where: whereCondition }),
      ])

      const totalPages = Math.ceil(total / limit)

      this.logger.log(
        `用户 ${userId} 获取了项目 ${projectId} 中 API ${apiId} 的操作日志，数量 ${logs.length}`,
      )

      return {
        logs,
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
      if (error instanceof HanaException)
        throw error
      this.logger.error(`获取 API 操作日志失败: ${error.message}`, error.stack)
      throw new HanaException('INTERNAL_SERVER_ERROR')
    }
  }
}
