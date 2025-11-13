import { Injectable, Logger } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { ErrorCode } from '@/common/exceptions/error-code'
import { HanaException } from '@/common/exceptions/hana.exception'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { ProjectUtilsService } from '@/project/utils.service'
import { CreateApiReqDto } from './dto/create-api.dto'
import { GetApisReqDto } from './dto/get-apis.dto'
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
      // 1) 基础校验：项目存在 & 用户是项目成员
      await this.projectUtilsService.getProjectById(projectId)
      await this.projectUtilsService.checkUserProjectMembership(projectId, userId)
      // 2) 分组校验
      await this.apiUtilsService.checkApiGroupExists(projectId, dto.groupId)

      // 3) 事务：创建 API / 版本 / 快照，并设置 currentVersionId
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

  /** 获取 API 列表 */
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
  async updateAPI() {}
}
