import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import { FastifyRequest } from 'fastify'
import { ProjectPermissions } from '@/common/decorators/permissions.decorator'
import { AuthGuard } from '@/common/guards/auth.guard'
import { PermissionsGuard } from '@/common/guards/permissions.guard'
import {
  CreateProjectEnvironmentDto,
  CreateProjectEnvironmentResponseDto,
  DeleteProjectEnvironmentResponseDto,
  ProjectEnvironmentsResponseDto,
  UpdateProjectEnvironmentDto,
  UpdateProjectEnvironmentResponseDto,
} from './old-dto'
import { ProjectEnvironmentService } from './project-environment.service'

@Controller('projects')
@UseGuards(AuthGuard, PermissionsGuard)
export class ProjectEnvironmentController {
  constructor(
    private readonly projectEnvironmentService: ProjectEnvironmentService,
  ) {}

  /**
   * 创建项目环境
   * 需要项目环境管理权限
   */
  @Post(':projectId/environments')
  @ProjectPermissions(['project:write'])
  async createProjectEnvironment(
    @Param('projectId') projectId: string,
    @Body() createEnvDto: CreateProjectEnvironmentDto,
    @Req() request: FastifyRequest,
  ): Promise<CreateProjectEnvironmentResponseDto> {
    const user = request.user!
    return await this.projectEnvironmentService.createProjectEnvironment(projectId, createEnvDto, user.id)
  }

  /**
   * 获取项目环境列表
   * 需要项目读取权限
   */
  @Get(':projectId/environments')
  @ProjectPermissions(['project:read'])
  async getProjectEnvironments(
    @Param('projectId') projectId: string,
    @Req() request: FastifyRequest,
  ): Promise<ProjectEnvironmentsResponseDto> {
    const user = request.user!
    return await this.projectEnvironmentService.getProjectEnvironments(projectId, user.id)
  }

  /**
   * 更新项目环境
   * 需要项目环境管理权限
   */
  @Patch(':projectId/environments/:environmentId')
  @ProjectPermissions(['project:write'])
  async updateProjectEnvironment(
    @Param('projectId') projectId: string,
    @Param('environmentId') environmentId: string,
    @Body() updateEnvDto: UpdateProjectEnvironmentDto,
    @Req() request: FastifyRequest,
  ): Promise<UpdateProjectEnvironmentResponseDto> {
    const user = request.user!
    return await this.projectEnvironmentService.updateProjectEnvironment(projectId, environmentId, updateEnvDto, user.id)
  }

  /**
   * 删除项目环境
   * 需要项目环境管理权限
   */
  @Delete(':projectId/environments/:environmentId')
  @ProjectPermissions(['project:write'])
  async deleteProjectEnvironment(
    @Param('projectId') projectId: string,
    @Param('environmentId') environmentId: string,
    @Req() request: FastifyRequest,
  ): Promise<DeleteProjectEnvironmentResponseDto> {
    const user = request.user!
    return await this.projectEnvironmentService.deleteProjectEnvironment(projectId, environmentId, user.id)
  }
}
