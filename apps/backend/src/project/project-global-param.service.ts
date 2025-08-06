import { Inject, Injectable, Logger } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { ErrorCode } from '@/common/exceptions/error-code'
import { HanaException } from '@/common/exceptions/hana.exception'
import { PrismaService } from '@/infra/prisma/prisma.service'
import {
  BatchCreateGlobalParamsDto,
  BatchCreateGlobalParamsResponseDto,
  CreateGlobalParamDto,
  CreateGlobalParamResponseDto,
  DeleteGlobalParamResponseDto,
  GlobalParamInfoDto,
  GlobalParamQueryDto,
  GlobalParamsResponseDto,
  UpdateGlobalParamDto,
  UpdateGlobalParamResponseDto,
} from './dto'

@Injectable()
export class ProjectGlobalParamService {
  private readonly logger = new Logger(ProjectGlobalParamService.name)

  @Inject(PrismaService)
  private readonly prisma: PrismaService

  /**
   * 创建全局参数
   * @param projectId 项目 ID
   * @param createParamDto 创建参数信息
   * @param userId 操作用户 ID
   */
  async createGlobalParam(projectId: string, createParamDto: CreateGlobalParamDto, userId: string): Promise<CreateGlobalParamResponseDto> {
    try {
      // 检查项目是否存在
      await this.getProjectById(projectId)

      // 验证用户权限
      await this.checkUserProjectMembership(projectId, userId)

      // 检查参数名称在同一类别下是否已存在
      const existingParam = await this.prisma.globalParam.findUnique({
        where: {
          projectId_category_name: {
            projectId,
            category: createParamDto.category,
            name: createParamDto.name,
          },
        },
      })

      if (existingParam) {
        throw new HanaException(`参数 "${createParamDto.name}" 在类别 "${createParamDto.category}" 下已存在`, ErrorCode.PERMISSION_NAME_EXISTS)
      }

      // 创建全局参数
      const globalParam = await this.prisma.globalParam.create({
        data: {
          projectId,
          category: createParamDto.category,
          name: createParamDto.name,
          type: createParamDto.type,
          value: createParamDto.value,
          description: createParamDto.description,
          isActive: createParamDto.isActive ?? true,
        },
      })

      this.logger.log(`用户 ${userId} 在项目 ${projectId} 中创建了全局参数 ${globalParam.name}`)

      return {
        message: '全局参数创建成功',
        param: {
          id: globalParam.id,
          category: globalParam.category as any,
          name: globalParam.name,
          type: globalParam.type as any,
          value: globalParam.value,
          description: globalParam.description || undefined,
          isActive: globalParam.isActive,
          createdAt: globalParam.createdAt,
          updatedAt: globalParam.updatedAt,
        },
      }
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }

      this.logger.error(`创建全局参数失败: ${error.message}`, error.stack)
      throw new HanaException('创建全局参数失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /**
   * 获取全局参数列表
   * @param projectId 项目 ID
   * @param userId 当前用户 ID
   * @param query 查询参数
   */
  async getGlobalParams(projectId: string, userId: string, query: GlobalParamQueryDto): Promise<GlobalParamsResponseDto> {
    const { page = 1, limit = 10, search, category, type, isActive } = query

    try {
      // 检查项目是否存在和用户权限
      await this.getProjectById(projectId)
      await this.checkUserProjectMembership(projectId, userId)

      const skip = (page - 1) * limit

      // 构建查询条件
      const whereCondition: Prisma.GlobalParamWhereInput = {
        projectId,
        ...(category && { category }),
        ...(type && { type }),
        ...(isActive !== undefined && { isActive }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
      }

      // 查询参数列表和总数
      const [params, total] = await Promise.all([
        this.prisma.globalParam.findMany({
          where: whereCondition,
          skip,
          take: limit,
          orderBy: [
            { category: 'asc' },
            { name: 'asc' },
          ],
        }),
        this.prisma.globalParam.count({ where: whereCondition }),
      ])

      const paramList: GlobalParamInfoDto[] = params.map(param => ({
        id: param.id,
        category: param.category as any,
        name: param.name,
        type: param.type as any,
        value: param.value,
        description: param.description || undefined,
        isActive: param.isActive,
        createdAt: param.createdAt,
        updatedAt: param.updatedAt,
      }))

      const totalPages = Math.ceil(total / limit)

      return {
        params: paramList,
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
      if (error instanceof HanaException) {
        throw error
      }

      this.logger.error(`获取全局参数列表失败: ${error.message}`, error.stack)
      throw new HanaException('获取全局参数列表失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /**
   * 更新全局参数
   * @param projectId 项目 ID
   * @param paramId 参数 ID
   * @param updateParamDto 更新数据
   * @param userId 操作用户 ID
   */
  async updateGlobalParam(projectId: string, paramId: string, updateParamDto: UpdateGlobalParamDto, userId: string): Promise<UpdateGlobalParamResponseDto> {
    try {
      // 检查项目是否存在
      await this.getProjectById(projectId)

      // 验证用户权限
      await this.checkUserProjectMembership(projectId, userId)

      // 检查参数是否存在
      const existingParam = await this.prisma.globalParam.findUnique({
        where: { id: paramId },
      })

      if (!existingParam || existingParam.projectId !== projectId) {
        throw new HanaException('全局参数不存在', ErrorCode.PERMISSION_NOT_FOUND, 404)
      }

      // 更新参数
      const updatedParam = await this.prisma.globalParam.update({
        where: { id: paramId },
        data: {
          ...(updateParamDto.type && { type: updateParamDto.type }),
          ...(updateParamDto.value !== undefined && { value: updateParamDto.value }),
          ...(updateParamDto.description !== undefined && { description: updateParamDto.description }),
          ...(updateParamDto.isActive !== undefined && { isActive: updateParamDto.isActive }),
        },
      })

      this.logger.log(`用户 ${userId} 更新了项目 ${projectId} 中的全局参数 ${updatedParam.name}`)

      return {
        message: '全局参数更新成功',
        param: {
          id: updatedParam.id,
          category: updatedParam.category as any,
          name: updatedParam.name,
          type: updatedParam.type as any,
          value: updatedParam.value,
          description: updatedParam.description || undefined,
          isActive: updatedParam.isActive,
          createdAt: updatedParam.createdAt,
          updatedAt: updatedParam.updatedAt,
        },
      }
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }

      this.logger.error(`更新全局参数失败: ${error.message}`, error.stack)
      throw new HanaException('更新全局参数失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /**
   * 删除全局参数
   * @param projectId 项目 ID
   * @param paramId 参数 ID
   * @param userId 操作用户 ID
   */
  async deleteGlobalParam(projectId: string, paramId: string, userId: string): Promise<DeleteGlobalParamResponseDto> {
    try {
      // 检查项目是否存在
      await this.getProjectById(projectId)

      // 验证用户权限
      await this.checkUserProjectMembership(projectId, userId)

      // 检查参数是否存在
      const existingParam = await this.prisma.globalParam.findUnique({
        where: { id: paramId },
      })

      if (!existingParam || existingParam.projectId !== projectId) {
        throw new HanaException('全局参数不存在', ErrorCode.PERMISSION_NOT_FOUND, 404)
      }

      // 删除参数
      await this.prisma.globalParam.delete({
        where: { id: paramId },
      })

      this.logger.log(`用户 ${userId} 删除了项目 ${projectId} 中的全局参数 ${existingParam.name}`)

      return {
        message: '全局参数删除成功',
        deletedParamId: paramId,
      }
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }

      this.logger.error(`删除全局参数失败: ${error.message}`, error.stack)
      throw new HanaException('删除全局参数失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /**
   * 批量创建全局参数
   * @param projectId 项目 ID
   * @param batchCreateDto 批量创建参数信息
   * @param userId 操作用户 ID
   */
  async batchCreateGlobalParams(projectId: string, batchCreateDto: BatchCreateGlobalParamsDto, userId: string): Promise<BatchCreateGlobalParamsResponseDto> {
    try {
      // 检查项目是否存在
      await this.getProjectById(projectId)

      // 验证用户权限
      await this.checkUserProjectMembership(projectId, userId)

      // 检查参数名称是否有重复
      const paramKeys = batchCreateDto.params.map(p => ({ category: p.category, name: p.name }))
      const duplicateKeys = paramKeys.filter((key, index) =>
        paramKeys.findIndex(k => k.category === key.category && k.name === key.name) !== index,
      )

      if (duplicateKeys.length > 0) {
        throw new HanaException('批量创建的参数中存在重复的名称', ErrorCode.PERMISSION_NAME_EXISTS)
      }

      // 检查数据库中是否已存在相同的参数
      const existingParams = await this.prisma.globalParam.findMany({
        where: {
          projectId,
          OR: paramKeys.map(key => ({
            category: key.category,
            name: key.name,
          })),
        },
      })

      if (existingParams.length > 0) {
        const conflictNames = existingParams.map(p => `${p.category}:${p.name}`).join(', ')
        throw new HanaException(`以下参数已存在: ${conflictNames}`, ErrorCode.PERMISSION_NAME_EXISTS)
      }

      // 使用事务批量创建参数
      const createdParams = await this.prisma.$transaction(
        batchCreateDto.params.map(paramDto =>
          this.prisma.globalParam.create({
            data: {
              projectId,
              category: paramDto.category,
              name: paramDto.name,
              type: paramDto.type,
              value: paramDto.value,
              description: paramDto.description,
              isActive: paramDto.isActive ?? true,
            },
          }),
        ),
      )

      this.logger.log(`用户 ${userId} 在项目 ${projectId} 中批量创建了 ${createdParams.length} 个全局参数`)

      const paramList: GlobalParamInfoDto[] = createdParams.map(param => ({
        id: param.id,
        category: param.category as any,
        name: param.name,
        type: param.type as any,
        value: param.value,
        description: param.description || undefined,
        isActive: param.isActive,
        createdAt: param.createdAt,
        updatedAt: param.updatedAt,
      }))

      return {
        message: '批量创建全局参数成功',
        createdCount: createdParams.length,
        params: paramList,
      }
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }

      this.logger.error(`批量创建全局参数失败: ${error.message}`, error.stack)
      throw new HanaException('批量创建全局参数失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 根据 ID 获取项目信息
   * @param projectId 项目 ID
   */
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

  /**
   * 检查用户是否为项目成员
   * @param projectId 项目 ID
   * @param userId 用户 ID
   */
  private async checkUserProjectMembership(projectId: string, userId: string): Promise<void> {
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
}
