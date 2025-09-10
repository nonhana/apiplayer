import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { ProjectPermissions } from '@/common/decorators/permissions.decorator'
import { ReqUser } from '@/common/decorators/req-user.decorator'
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
    @ReqUser('id') userId: string,
  ): Promise<ProjectEnvDto> {
    const newEnv = await this.projectEnvService.createProjectEnv(projectId, createEnvDto, userId)
    return plainToInstance(ProjectEnvDto, newEnv)
  }

  /**
   * 获取项目环境列表
   */
  @Get(':projectId/environments')
  @ProjectPermissions(['project:read'])
  async getProjectEnvironments(
    @Param('projectId') projectId: string,
    @ReqUser('id') userId: string,
  ): Promise<ProjectEnvDto[]> {
    const envs = await this.projectEnvService.getProjectEnvs(projectId, userId)
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
    @ReqUser('id') userId: string,
  ): Promise<ProjectEnvDto> {
    const updatedEnv = await this.projectEnvService.updateProjectEnv(projectId, environmentId, updateEnvDto, userId)
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
    @ReqUser('id') userId: string,
  ): Promise<void> {
    await this.projectEnvService.deleteProjectEnv(projectId, environmentId, userId)
  }
}
