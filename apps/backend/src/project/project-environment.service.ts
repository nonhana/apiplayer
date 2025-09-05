import { Injectable, Logger } from '@nestjs/common'
import { ErrorCode } from '@/common/exceptions/error-code'
import { HanaException } from '@/common/exceptions/hana.exception'
import { PrismaService } from '@/infra/prisma/prisma.service'
import {
  CreateProjectEnvironmentDto,
  CreateProjectEnvironmentResponseDto,
  DeleteProjectEnvironmentResponseDto,
  ProjectEnvironmentInfoDto,
  ProjectEnvironmentsResponseDto,
  UpdateProjectEnvironmentDto,
  UpdateProjectEnvironmentResponseDto,
} from './old-dto'
import { ProjectUtilsService } from './utils.service'

@Injectable()
export class ProjectEnvironmentService {
  private readonly logger = new Logger(ProjectEnvironmentService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly projectUtilsService: ProjectUtilsService,
  ) {}

  /**
   * 创建项目环境
   * @param projectId 项目 ID
   * @param createEnvDto 创建环境参数
   * @param userId 操作用户 ID
   */
  async createProjectEnvironment(projectId: string, createEnvDto: CreateProjectEnvironmentDto, userId: string): Promise<CreateProjectEnvironmentResponseDto> {
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
            name: createEnvDto.name,
          },
        },
      })

      if (existingEnv) {
        throw new HanaException('环境名称已存在', ErrorCode.ENVIRONMENT_NAME_EXISTS)
      }

      // 如果设置为默认环境，需要先取消其他默认环境
      if (createEnvDto.isDefault) {
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
          name: createEnvDto.name,
          type: createEnvDto.type,
          baseUrl: createEnvDto.baseUrl,
          variables: createEnvDto.variables || {},
          headers: createEnvDto.headers || {},
          isDefault: createEnvDto.isDefault || false,
        },
      })

      this.logger.log(`用户 ${userId} 在项目 ${projectId} 中创建了环境 ${environment.name}`)

      return {
        message: '环境创建成功',
        environment: {
          id: environment.id,
          name: environment.name,
          type: environment.type as any,
          baseUrl: environment.baseUrl,
          variables: environment.variables as Record<string, any>,
          headers: environment.headers as Record<string, any>,
          isDefault: environment.isDefault,
          createdAt: environment.createdAt,
          updatedAt: environment.updatedAt,
        },
      }
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }

      this.logger.error(`创建项目环境失败: ${error.message}`, error.stack)
      throw new HanaException('创建项目环境失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /**
   * 获取项目环境列表
   * @param projectId 项目 ID
   * @param userId 当前用户 ID
   */
  async getProjectEnvironments(projectId: string, userId: string): Promise<ProjectEnvironmentsResponseDto> {
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

      const environmentList: ProjectEnvironmentInfoDto[] = environments.map(env => ({
        id: env.id,
        name: env.name,
        type: env.type as any,
        baseUrl: env.baseUrl,
        variables: env.variables as Record<string, any>,
        headers: env.headers as Record<string, any>,
        isDefault: env.isDefault,
        createdAt: env.createdAt,
        updatedAt: env.updatedAt,
      }))

      return {
        environments: environmentList,
        total: environmentList.length,
      }
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }

      this.logger.error(`获取项目环境列表失败: ${error.message}`, error.stack)
      throw new HanaException('获取项目环境列表失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /**
   * 更新项目环境
   * @param projectId 项目 ID
   * @param environmentId 环境 ID
   * @param updateEnvDto 更新数据
   * @param userId 操作用户 ID
   */
  async updateProjectEnvironment(projectId: string, environmentId: string, updateEnvDto: UpdateProjectEnvironmentDto, userId: string): Promise<UpdateProjectEnvironmentResponseDto> {
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
      if (updateEnvDto.name && updateEnvDto.name !== existingEnv.name) {
        const duplicateEnv = await this.prisma.projectEnvironment.findUnique({
          where: {
            projectId_name: {
              projectId,
              name: updateEnvDto.name,
            },
          },
        })

        if (duplicateEnv) {
          throw new HanaException('环境名称已存在', ErrorCode.ENVIRONMENT_NAME_EXISTS)
        }
      }

      // 如果设置为默认环境，需要先取消其他默认环境
      if (updateEnvDto.isDefault && !existingEnv.isDefault) {
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
          ...(updateEnvDto.name && { name: updateEnvDto.name }),
          ...(updateEnvDto.type && { type: updateEnvDto.type }),
          ...(updateEnvDto.baseUrl && { baseUrl: updateEnvDto.baseUrl }),
          ...(updateEnvDto.variables !== undefined && { variables: updateEnvDto.variables }),
          ...(updateEnvDto.headers !== undefined && { headers: updateEnvDto.headers }),
          ...(updateEnvDto.isDefault !== undefined && { isDefault: updateEnvDto.isDefault }),
        },
      })

      this.logger.log(`用户 ${userId} 更新了项目 ${projectId} 中的环境 ${updatedEnv.name}`)

      return {
        message: '环境更新成功',
        environment: {
          id: updatedEnv.id,
          name: updatedEnv.name,
          type: updatedEnv.type as any,
          baseUrl: updatedEnv.baseUrl,
          variables: updatedEnv.variables as Record<string, any>,
          headers: updatedEnv.headers as Record<string, any>,
          isDefault: updatedEnv.isDefault,
          createdAt: updatedEnv.createdAt,
          updatedAt: updatedEnv.updatedAt,
        },
      }
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }

      this.logger.error(`更新项目环境失败: ${error.message}`, error.stack)
      throw new HanaException('更新项目环境失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /**
   * 删除项目环境
   * @param projectId 项目 ID
   * @param environmentId 环境 ID
   * @param userId 操作用户 ID
   */
  async deleteProjectEnvironment(projectId: string, environmentId: string, userId: string): Promise<DeleteProjectEnvironmentResponseDto> {
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
        message: '环境删除成功',
        deletedEnvironmentId: environmentId,
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
