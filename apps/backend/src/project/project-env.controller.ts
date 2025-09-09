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
import { plainToInstance } from 'class-transformer'
import { FastifyRequest } from 'fastify'
import { ProjectPermissions } from '@/common/decorators/permissions.decorator'
import { ResMsg } from '@/common/decorators/res-msg.decorator'
import { AuthGuard } from '@/common/guards/auth.guard'
import { PermissionsGuard } from '@/common/guards/permissions.guard'
import {
  CreateProjectEnvReqDto,
  ProjectEnvDto,
  UpdateProjectEnvReqDto,
} from './dto'
import { ProjectEnvService } from './project-env.service'

@Controller('projects')
@UseGuards(AuthGuard, PermissionsGuard)
export class ProjectEnvController {
  constructor(
    private readonly projectEnvService: ProjectEnvService,
  ) {}

  /**
   * 创建项目环境
   */
  @Post(':projectId/environments')
  @ProjectPermissions(['project:write'])
  async createProjectEnvironment(
    @Param('projectId') projectId: string,
    @Body() createEnvDto: CreateProjectEnvReqDto,
    @Req() request: FastifyRequest,
  ): Promise<ProjectEnvDto> {
    const user = request.user!
    const newEnv = await this.projectEnvService.createProjectEnv(projectId, createEnvDto, user.id)
    return plainToInstance(ProjectEnvDto, newEnv)
  }

  /**
   * 获取项目环境列表
   */
  @Get(':projectId/environments')
  @ProjectPermissions(['project:read'])
  async getProjectEnvironments(
    @Param('projectId') projectId: string,
    @Req() request: FastifyRequest,
  ): Promise<ProjectEnvDto[]> {
    const user = request.user!
    const envs = await this.projectEnvService.getProjectEnvs(projectId, user.id)
    return plainToInstance(ProjectEnvDto, envs)
  }

  /**
   * 更新项目环境
   */
  @Patch(':projectId/environments/:environmentId')
  @ProjectPermissions(['project:write'])
  async updateProjectEnvironment(
    @Param('projectId') projectId: string,
    @Param('environmentId') environmentId: string,
    @Body() updateEnvDto: UpdateProjectEnvReqDto,
    @Req() request: FastifyRequest,
  ): Promise<ProjectEnvDto> {
    const user = request.user!
    const updatedEnv = await this.projectEnvService.updateProjectEnv(projectId, environmentId, updateEnvDto, user.id)
    return plainToInstance(ProjectEnvDto, updatedEnv)
  }

  /**
   * 删除项目环境
   */
  @Delete(':projectId/environments/:environmentId')
  @ProjectPermissions(['project:write'])
  @ResMsg('项目环境删除成功')
  async deleteProjectEnvironment(
    @Param('projectId') projectId: string,
    @Param('environmentId') environmentId: string,
    @Req() request: FastifyRequest,
  ): Promise<void> {
    const user = request.user!
    await this.projectEnvService.deleteProjectEnv(projectId, environmentId, user.id)
  }
}
