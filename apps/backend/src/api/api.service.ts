import { Injectable, Logger } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { ErrorCode } from '@/common/exceptions/error-code'
import { HanaException } from '@/common/exceptions/hana.exception'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { ProjectUtilsService } from '@/project/utils.service'
import { CloneApiReqDto } from './dto/clone-api.dto'
import { CreateApiReqDto } from './dto/create-api.dto'
import { GetApisReqDto } from './dto/get-apis.dto'
import { UpdateApiReqDto } from './dto/update-api.dto'
import { ApiUtilsService } from './utils.service'

@Injectable()
export class ApiService {
  private readonly logger = new Logger(ApiService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly projectUtilsService: ProjectUtilsService,
    private readonly apiUtilsService: ApiUtilsService,
  ) {}

  /** 创建 API */
  async createAPI(dto: CreateApiReqDto, projectId: string, userId: string) {
    try {
      await this.projectUtilsService.getProjectById(projectId)
      await this.projectUtilsService.checkUserProjectMembership(projectId, userId)
      await this.apiUtilsService.checkApiGroupExists(projectId, dto.groupId)

      const created = await this.prisma.$transaction(async (tx) => {
        const api = await tx.aPI.create({
          data: {
            projectId,
            groupId: dto.groupId,
            name: dto.name,
            method: dto.method,
            path: dto.path,
            tags: dto.tags ?? [],
            sortOrder: dto.sortOrder ?? 0,
            ownerId: dto.ownerId ?? null,
            editorId: userId,
            creatorId: userId,
          },
        })

        const version = await tx.aPIVersion.create({
          data: {
            apiId: api.id,
            projectId,
            version: dto.version ?? 'v1.0.0',
            status: 'DRAFT',
            summary: dto.summary,
            editorId: userId,
            changes: ['CREATE'],
          },
        })

        await tx.aPISnapshot.create({
          data: {
            versionId: version.id,
            name: api.name,
            method: api.method,
            path: api.path,
            summary: dto.summary,
            description: dto.description,
            tags: api.tags,
            status: dto.status ?? 'DRAFT',
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

        return api
      })

      this.logger.log(
        `用户 ${userId} 在项目 ${projectId} 中创建了 API ${created.name}`,
      )
      return created
    }
    catch (error) {
      if (error instanceof HanaException)
        throw error
      this.logger.error(`创建 API 失败: ${error.message}`, error.stack)
      if ((error as Prisma.PrismaClientKnownRequestError).code === 'P2002') {
        throw new HanaException(
          '同一路径与方法的 API 已存在',
          ErrorCode.INVALID_PARAMS,
        )
      }
      throw new HanaException(
        '创建 API 失败',
        ErrorCode.INTERNAL_SERVER_ERROR,
        500,
      )
    }
  }

  /** 查询 API 列表 */
  async getAPIList(dto: GetApisReqDto, projectId: string, userId: string) {
    const { page = 1, limit = 10, search, groupId, method, status } = dto

    try {
      const skip = (page - 1) * limit

      // 前置校验
      await this.projectUtilsService.getProjectById(projectId)
      await this.projectUtilsService.checkUserProjectMembership(projectId, userId)

      // 构建查询条件
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
      throw new HanaException(
        '获取 API 列表失败',
        ErrorCode.INTERNAL_SERVER_ERROR,
        500,
      )
    }
  }

  /** 获取 API 详情 */
  async getAPIDetail(apiId: string, projectId: string, userId: string) {
    try {
      await this.projectUtilsService.getProjectById(projectId)
      await this.projectUtilsService.checkUserProjectMembership(projectId, userId)

      const api = await this.prisma.aPI.findUnique({
        where: { id: apiId },
        include: {
          group: true,
          currentVersion: { include: { snapshot: true } },
        },
      })

      if (!api || api.projectId !== projectId || api.recordStatus !== 'ACTIVE') {
        throw new HanaException('API 不存在', ErrorCode.INVALID_PARAMS, 404)
      }

      return api
    }
    catch (error) {
      if (error instanceof HanaException)
        throw error
      this.logger.error(`获取 API 详情失败: ${error.message}`, error.stack)
      throw new HanaException(
        '获取 API 详情失败',
        ErrorCode.INTERNAL_SERVER_ERROR,
        500,
      )
    }
  }

  /** 更新 API 信息 */
  async updateAPI(dto: UpdateApiReqDto, apiId: string, projectId: string, userId: string) {
    try {
      // 基础校验
      await this.projectUtilsService.getProjectById(projectId)
      await this.projectUtilsService.checkUserProjectMembership(projectId, userId)

      // 获取目标 API
      const api = await this.prisma.aPI.findUnique({
        where: { id: apiId },
        include: { currentVersion: { include: { snapshot: true } } },
      })
      if (!api || api.projectId !== projectId || api.recordStatus !== 'ACTIVE') {
        throw new HanaException('API 不存在', ErrorCode.INVALID_PARAMS, 404)
      }

      // 更新流程：
      // 更新基本信息 -> 新建版本 -> 创建快照 -> 切换到新 version -> 归档旧 version -> 返回更新后的 API
      const updated = await this.prisma.$transaction(async (tx) => {
        // 更新 API 基本信息（仅当提供）
        if (dto.baseInfo) {
          await tx.aPI.update({
            where: { id: apiId },
            data: {
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

        // 计算下一个版本号
        const prevVersion = api.currentVersion?.version
        const curVersion
          = dto.versionInfo?.version ?? this.apiUtilsService.genNextVersion(prevVersion)

        // 新建版本（CURRENT）
        const version = await tx.aPIVersion.create({
          data: {
            apiId: api.id,
            projectId,
            version: curVersion,
            status: 'CURRENT',
            editorId: userId,
            changes: dto.versionInfo?.changes?.length
              ? dto.versionInfo.changes
              : ['BASIC_INFO'],
            summary: dto.versionInfo?.summary,
            changelog: dto.versionInfo?.changelog,
            publishedAt: new Date(),
          },
        })

        // 新建快照信息
        const prevSnap = api.currentVersion?.snapshot
        await tx.aPISnapshot.create({
          data: {
            versionId: version.id,
            name: dto.baseInfo?.name ?? api.name,
            method: dto.baseInfo?.method ?? api.method,
            path: dto.baseInfo?.path ?? api.path,
            summary: dto.versionInfo?.summary ?? prevSnap?.summary ?? undefined,
            description: dto.baseInfo?.description ?? prevSnap?.description ?? undefined,
            tags: dto.baseInfo?.tags ?? api.tags,
            status: dto.baseInfo?.status ?? prevSnap?.status ?? 'PUBLISHED',
            requestHeaders: dto.coreInfo?.requestHeaders ?? prevSnap?.requestHeaders ?? [],
            pathParams: dto.coreInfo?.pathParams ?? prevSnap?.pathParams ?? [],
            queryParams: dto.coreInfo?.queryParams ?? prevSnap?.queryParams ?? [],
            requestBody: dto.coreInfo?.requestBody ?? prevSnap?.requestBody ?? undefined,
            responses: dto.coreInfo?.responses ?? prevSnap?.responses ?? [],
            examples: dto.coreInfo?.examples ?? prevSnap?.examples ?? {},
            mockConfig: dto.coreInfo?.mockConfig ?? prevSnap?.mockConfig ?? undefined,
          },
        })

        // 切换 currentVersionId
        await tx.aPI.update({
          where: { id: apiId },
          data: { currentVersionId: version.id, updatedAt: new Date() },
        })

        // 归档旧 version
        if (api.currentVersion?.id) {
          await tx.aPIVersion.update({
            where: { id: api.currentVersion.id },
            data: { status: 'ARCHIVED' },
          })
        }

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
        throw new HanaException(
          '同一路径与方法的 API 已存在',
          ErrorCode.INVALID_PARAMS,
        )
      }
      throw new HanaException(
        '更新 API 失败',
        ErrorCode.INTERNAL_SERVER_ERROR,
        500,
      )
    }
  }

  /** 删除 API */
  async deleteAPI(apiId: string, projectId: string, userId: string) {
    try {
      // 基础校验
      await this.projectUtilsService.getProjectById(projectId)
      await this.projectUtilsService.checkUserProjectMembership(projectId, userId)

      // 获取目标 API
      const api = await this.prisma.aPI.findUnique({ where: { id: apiId } })
      if (!api || api.projectId !== projectId || api.recordStatus !== 'ACTIVE') {
        throw new HanaException('API 不存在', ErrorCode.INVALID_PARAMS, 404)
      }

      // 软删除
      await this.prisma.aPI.update({
        where: { id: apiId },
        data: { recordStatus: 'DELETED' },
      })

      this.logger.log(`用户 ${userId} 删除了项目 ${projectId} 的 API ${apiId}`)
    }
    catch (error) {
      if (error instanceof HanaException)
        throw error
      this.logger.error(`删除 API 失败: ${error.message}`, error.stack)
      throw new HanaException(
        '删除 API 失败',
        ErrorCode.INTERNAL_SERVER_ERROR,
        500,
      )
    }
  }

  /** 复制 API */
  async cloneAPI(dto: CloneApiReqDto, apiId: string, projectId: string, userId: string) {
    try {
      // 基础校验
      await this.projectUtilsService.getProjectById(projectId)
      await this.projectUtilsService.checkUserProjectMembership(projectId, userId)
      await this.apiUtilsService.checkApiGroupExists(projectId, dto.targetGroupId)

      // 获取源 API 及当前版本与快照
      const source = await this.prisma.aPI.findUnique({
        where: { id: apiId },
        include: { currentVersion: { include: { snapshot: true } } },
      })
      if (!source || source.projectId !== projectId || source.recordStatus !== 'ACTIVE') {
        throw new HanaException('源 API 不存在', ErrorCode.INVALID_PARAMS, 404)
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
            version: 'v1.0.0',
            status: 'DRAFT',
            summary: source.currentVersion?.summary,
            editorId: userId,
            changes: ['CREATE'],
          },
        })

        const snap = source.currentVersion?.snapshot
        await tx.aPISnapshot.create({
          data: {
            versionId: version.id,
            name: targetName,
            method: targetMethod,
            path: targetPath,
            // 以下字段以源快照为模板，若不存在则回退到合理的默认值
            summary: snap?.summary ?? undefined,
            description: snap?.description ?? undefined,
            tags: clonedApi.tags,
            status: 'DRAFT',
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
        throw new HanaException(
          '同一路径与方法的 API 已存在',
          ErrorCode.INVALID_PARAMS,
        )
      }
      throw new HanaException(
        '复制 API 失败',
        ErrorCode.INTERNAL_SERVER_ERROR,
        500,
      )
    }
  }
}
