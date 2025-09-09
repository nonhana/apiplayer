import { Injectable, Logger } from '@nestjs/common'
import { ErrorCode } from '@/common/exceptions/error-code'
import { HanaException } from '@/common/exceptions/hana.exception'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { CreateProjectEnvReqDto } from './dto/env/create-env.dto'
import { UpdateProjectEnvReqDto } from './dto/env/update-env.dto'
import { ProjectUtilsService } from './utils.service'

@Injectable()
export class ProjectEnvService {
  private readonly logger = new Logger(ProjectEnvService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly projectUtilsService: ProjectUtilsService,
  ) {}

  async createProjectEnv(projectId: string, dto: CreateProjectEnvReqDto, userId: string) {
    try {
      // 检查项目是否存在
      await this.projectUtilsService.getProjectById(projectId)

      // 验证用户权限
      await this.projectUtilsService.checkUserProjectMembership(projectId, userId)

      // 检查环境名称是否已存在
      const existingEnv = await this.prisma.projectEnvironment.findUnique({
        where: {
          projectId_name: {
            projectId,
            name: dto.name,
          },
        },
      })

      if (existingEnv) {
        throw new HanaException('环境名称已存在', ErrorCode.ENVIRONMENT_NAME_EXISTS)
      }

      // 如果设置为默认环境，需要先取消其他默认环境
      if (dto.isDefault) {
        await this.prisma.projectEnvironment.updateMany({
          where: {
            projectId,
            isDefault: true,
          },
          data: { isDefault: false },
        })
      }

      // 创建环境
      const environment = await this.prisma.projectEnvironment.create({
        data: {
          projectId,
          name: dto.name,
          type: dto.type,
          baseUrl: dto.baseUrl,
          variables: dto.variables || {},
          headers: dto.headers || {},
          isDefault: dto.isDefault || false,
        },
      })

      this.logger.log(`用户 ${userId} 在项目 ${projectId} 中创建了环境 ${environment.name}`)

      return environment
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }

      this.logger.error(`创建项目环境失败: ${error.message}`, error.stack)
      throw new HanaException('创建项目环境失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  async getProjectEnvs(projectId: string, userId: string) {
    try {
      // 检查项目是否存在和用户权限
      await this.projectUtilsService.getProjectById(projectId)
      await this.projectUtilsService.checkUserProjectMembership(projectId, userId)

      const environments = await this.prisma.projectEnvironment.findMany({
        where: { projectId },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'asc' },
        ],
      })

      return environments
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }

      this.logger.error(`获取项目环境列表失败: ${error.message}`, error.stack)
      throw new HanaException('获取项目环境列表失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  async updateProjectEnv(projectId: string, environmentId: string, dto: UpdateProjectEnvReqDto, userId: string) {
    try {
      // 检查项目是否存在
      await this.projectUtilsService.getProjectById(projectId)

      // 验证用户权限
      await this.projectUtilsService.checkUserProjectMembership(projectId, userId)

      // 检查环境是否存在
      const existingEnv = await this.prisma.projectEnvironment.findUnique({
        where: { id: environmentId },
      })

      if (!existingEnv || existingEnv.projectId !== projectId) {
        throw new HanaException('环境不存在', ErrorCode.ENVIRONMENT_NOT_FOUND, 404)
      }

      // 如果更新名称，检查是否重复
      if (dto.name && dto.name !== existingEnv.name) {
        const duplicateEnv = await this.prisma.projectEnvironment.findUnique({
          where: {
            projectId_name: {
              projectId,
              name: dto.name,
            },
          },
        })

        if (duplicateEnv) {
          throw new HanaException('环境名称已存在', ErrorCode.ENVIRONMENT_NAME_EXISTS)
        }
      }

      // 如果设置为默认环境，需要先取消其他默认环境
      if (dto.isDefault && !existingEnv.isDefault) {
        await this.prisma.projectEnvironment.updateMany({
          where: {
            projectId,
            isDefault: true,
          },
          data: { isDefault: false },
        })
      }

      // 更新环境
      const updatedEnv = await this.prisma.projectEnvironment.update({
        where: { id: environmentId },
        data: {
          ...(dto.name && { name: dto.name }),
          ...(dto.type && { type: dto.type }),
          ...(dto.baseUrl && { baseUrl: dto.baseUrl }),
          ...(dto.variables !== undefined && { variables: dto.variables }),
          ...(dto.headers !== undefined && { headers: dto.headers }),
          ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
        },
      })

      this.logger.log(`用户 ${userId} 更新了项目 ${projectId} 中的环境 ${updatedEnv.name}`)

      return updatedEnv
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }

      this.logger.error(`更新项目环境失败: ${error.message}`, error.stack)
      throw new HanaException('更新项目环境失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  async deleteProjectEnv(projectId: string, environmentId: string, userId: string) {
    try {
      // 检查项目是否存在
      await this.projectUtilsService.getProjectById(projectId)

      // 验证用户权限
      await this.projectUtilsService.checkUserProjectMembership(projectId, userId)

      // 检查环境是否存在
      const environment = await this.prisma.projectEnvironment.findUnique({
        where: { id: environmentId },
      })

      if (!environment || environment.projectId !== projectId) {
        throw new HanaException('环境不存在', ErrorCode.ENVIRONMENT_NOT_FOUND, 404)
      }

      // 检查是否是默认环境且是最后一个环境
      if (environment.isDefault) {
        const envCount = await this.prisma.projectEnvironment.count({
          where: { projectId },
        })

        if (envCount === 1) {
          throw new HanaException('不能删除项目的最后一个环境', ErrorCode.CANNOT_DELETE_LAST_ENVIRONMENT)
        }

        // 如果删除的是默认环境，需要设置其他环境为默认
        const firstEnv = await this.prisma.projectEnvironment.findFirst({
          where: {
            projectId,
            id: { not: environmentId },
          },
        })

        if (firstEnv) {
          await this.prisma.projectEnvironment.update({
            where: { id: firstEnv.id },
            data: { isDefault: true },
          })
        }
      }

      // 删除环境
      await this.prisma.projectEnvironment.delete({
        where: { id: environmentId },
      })

      this.logger.log(`用户 ${userId} 删除了项目 ${projectId} 中的环境 ${environment.name}`)

      return {
        deletedEnvId: environmentId,
      }
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }

      this.logger.error(`删除项目环境失败: ${error.message}`, error.stack)
      throw new HanaException('删除项目环境失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }
}
