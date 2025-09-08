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
import { CreateProjectEnvDto } from './dto/create-env.dto'
import { DeleteProjectEnvResDto } from './dto/delete-env.dto'
import { ProjectEnvsResDto } from './dto/envs.dto'
import { ProjectEnvDto } from './dto/project-env.dto'
import { UpdateProjectEnvDto } from './dto/update-env.dto'
import { ProjectEnvService } from './project-env.service'

@Controller('projects')
@UseGuards(AuthGuard, PermissionsGuard)
export class ProjectEnvController {
  constructor(
    private readonly projectEnvService: ProjectEnvService,
  ) {}

  /**
   * 创建项目环境
   * 需要项目环境管理权限
   */
  @Post(':projectId/environments')
  @ProjectPermissions(['project:write'])
  async createProjectEnvironment(
    @Param('projectId') projectId: string,
    @Body() createEnvDto: CreateProjectEnvDto,
    @Req() request: FastifyRequest,
  ): Promise<ProjectEnvDto> {
    const user = request.user!
    return await this.projectEnvService.createProjectEnv(projectId, createEnvDto, user.id)
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
  ): Promise<ProjectEnvsResDto> {
    const user = request.user!
    return await this.projectEnvService.getProjectEnvs(projectId, user.id)
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
    @Body() updateEnvDto: UpdateProjectEnvDto,
    @Req() request: FastifyRequest,
  ): Promise<ProjectEnvDto> {
    const user = request.user!
    return await this.projectEnvService.updateProjectEnv(projectId, environmentId, updateEnvDto, user.id)
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
  ): Promise<DeleteProjectEnvResDto> {
    const user = request.user!
    return await this.projectEnvService.deleteProjectEnv(projectId, environmentId, user.id)
  }
}
