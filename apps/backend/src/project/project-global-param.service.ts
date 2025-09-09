import { Injectable, Logger } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { ErrorCode } from '@/common/exceptions/error-code'
import { HanaException } from '@/common/exceptions/hana.exception'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { CreateGlobalParamDto } from './dto/create-global-param.dto'
import { CreateGlobalParamsDto } from './dto/create-global-params.dto'
import { GetGlobalParamsDto } from './dto/get-global-params.dto'
import { UpdateGlobalParamDto } from './dto/update-global-param.dto'
import { ProjectUtilsService } from './utils.service'

@Injectable()
export class ProjectGlobalParamService {
  private readonly logger = new Logger(ProjectGlobalParamService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly projectUtilsService: ProjectUtilsService,
  ) {}

  async createGlobalParam(projectId: string, createParamDto: CreateGlobalParamDto, userId: string) {
    try {
      await this.projectUtilsService.getProjectById(projectId)
      await this.projectUtilsService.checkUserProjectMembership(projectId, userId)

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
      const newGlobalParam = await this.prisma.globalParam.create({
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

      this.logger.log(`用户 ${userId} 在项目 ${projectId} 中创建了全局参数 ${newGlobalParam.name}`)

      return newGlobalParam
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }

      this.logger.error(`创建全局参数失败: ${error.message}`, error.stack)
      throw new HanaException('创建全局参数失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  async getGlobalParams(projectId: string, userId: string, dto: GetGlobalParamsDto) {
    const { page = 1, limit = 10, search, category, type, isActive } = dto

    try {
      await this.projectUtilsService.getProjectById(projectId)
      await this.projectUtilsService.checkUserProjectMembership(projectId, userId)

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

      const totalPages = Math.ceil(total / limit)

      return {
        params,
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

  async updateGlobalParam(projectId: string, paramId: string, updateParamDto: UpdateGlobalParamDto, userId: string) {
    try {
      await this.projectUtilsService.getProjectById(projectId)
      await this.projectUtilsService.checkUserProjectMembership(projectId, userId)

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

      return updatedParam
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }

      this.logger.error(`更新全局参数失败: ${error.message}`, error.stack)
      throw new HanaException('更新全局参数失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  async deleteGlobalParam(projectId: string, paramId: string, userId: string) {
    try {
      await this.projectUtilsService.getProjectById(projectId)
      await this.projectUtilsService.checkUserProjectMembership(projectId, userId)

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

  async createGlobalParams(projectId: string, dto: CreateGlobalParamsDto, userId: string) {
    try {
      await this.projectUtilsService.getProjectById(projectId)
      await this.projectUtilsService.checkUserProjectMembership(projectId, userId)

      // 检查参数名称是否有重复
      const paramKeys = dto.params.map(p => ({ category: p.category, name: p.name }))
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
        dto.params.map(paramDto =>
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

      return {
        createdCount: createdParams.length,
        params: createdParams,
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
}
