import { Injectable, Logger } from '@nestjs/common'
import { GlobalParamWhereInput } from 'prisma/generated/models'
import { HanaException } from '@/common/exceptions/hana.exception'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { CreateGlobalParamReqDto, CreateGlobalParamsReqDto, GetGlobalParamsReqDto, UpdateGlobalParamReqDto } from './dto'
import { ProjectUtilsService } from './utils.service'

@Injectable()
export class ProjectGlobalParamService {
  private readonly logger = new Logger(ProjectGlobalParamService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly projectUtilsService: ProjectUtilsService,
  ) {}

  async createGlobalParam(dto: CreateGlobalParamReqDto, projectId: string, userId: string) {
    try {
      await this.projectUtilsService.getProjectById(projectId)

      const existingParam = await this.prisma.globalParam.findUnique({
        where: {
          projectId_category_name: {
            projectId,
            category: dto.category,
            name: dto.name,
          },
        },
      })

      if (existingParam) {
        throw new HanaException('GLOBAL_PARAM_NAME_EXISTS')
      }

      // 创建全局参数
      const newGlobalParam = await this.prisma.globalParam.create({
        data: {
          projectId,
          category: dto.category,
          name: dto.name,
          type: dto.type,
          value: dto.value,
          description: dto.description,
          isActive: dto.isActive ?? true,
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
      throw new HanaException('INTERNAL_SERVER_ERROR')
    }
  }

  async getGlobalParams(dto: GetGlobalParamsReqDto, projectId: string) {
    const { page = 1, limit = 10, search, category, type, isActive } = dto

    try {
      await this.projectUtilsService.getProjectById(projectId)

      const skip = (page - 1) * limit

      const whereCondition: GlobalParamWhereInput = {
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
      throw new HanaException('INTERNAL_SERVER_ERROR')
    }
  }

  async updateGlobalParam(dto: UpdateGlobalParamReqDto, projectId: string, paramId: string, userId: string) {
    try {
      await this.projectUtilsService.getProjectById(projectId)

      // 检查参数是否存在
      const existingParam = await this.prisma.globalParam.findUnique({
        where: { id: paramId },
      })

      if (!existingParam || existingParam.projectId !== projectId) {
        throw new HanaException('GLOBAL_PARAM_NOT_FOUND')
      }

      // 更新参数
      const updatedParam = await this.prisma.globalParam.update({
        where: { id: paramId },
        data: {
          ...(dto.type && { type: dto.type }),
          ...(dto.value !== undefined && { value: dto.value }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
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
      throw new HanaException('INTERNAL_SERVER_ERROR')
    }
  }

  async deleteGlobalParam(projectId: string, paramId: string, userId: string) {
    try {
      await this.projectUtilsService.getProjectById(projectId)

      // 检查参数是否存在
      const existingParam = await this.prisma.globalParam.findUnique({
        where: { id: paramId },
      })

      if (!existingParam || existingParam.projectId !== projectId) {
        throw new HanaException('GLOBAL_PARAM_NOT_FOUND')
      }

      // 删除参数
      await this.prisma.globalParam.delete({
        where: { id: paramId },
      })

      this.logger.log(`用户 ${userId} 删除了项目 ${projectId} 中的全局参数 ${existingParam.name}`)
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }
      this.logger.error(`删除全局参数失败: ${error.message}`, error.stack)
      throw new HanaException('INTERNAL_SERVER_ERROR')
    }
  }

  async createGlobalParams(dto: CreateGlobalParamsReqDto, projectId: string, userId: string) {
    try {
      await this.projectUtilsService.getProjectById(projectId)

      // 检查参数名称是否有重复
      const paramKeys = dto.params
      const duplicateKeys = paramKeys.filter((key, index) =>
        paramKeys.findIndex(k => k.category === key.category && k.name === key.name) !== index,
      )

      if (duplicateKeys.length > 0) {
        throw new HanaException('INVALID_PARAMS')
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
        throw new HanaException('GLOBAL_PARAM_NAME_EXISTS')
      }

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

      return createdParams
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }
      this.logger.error(`批量创建全局参数失败: ${error.message}`, error.stack)
      throw new HanaException('INTERNAL_SERVER_ERROR')
    }
  }
}
