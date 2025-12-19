import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { ProjectPermissions, RequireProjectMember } from '@/common/decorators/permissions.decorator'
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

  /** 创建项目环境 */
  @Post(':projectId/environments')
  @RequireProjectMember()
  @ProjectPermissions(['project:write'])
  async createProjectEnvironment(
    @Param('projectId') projectId: string,
    @Body() dto: CreateProjectEnvReqDto,
    @ReqUser('id') userId: string,
  ): Promise<ProjectEnvDto> {
    const result = await this.projectEnvService.createProjectEnv(dto, projectId, userId)
    return plainToInstance(ProjectEnvDto, result)
  }

  /** 获取项目环境列表 */
  @Get(':projectId/environments')
  @RequireProjectMember()
  @ProjectPermissions(['project:read'])
  async getProjectEnvironments(
    @Param('projectId') projectId: string,
  ): Promise<ProjectEnvDto[]> {
    const result = await this.projectEnvService.getProjectEnvs(projectId)
    return plainToInstance(ProjectEnvDto, result)
  }

  /** 更新项目环境 */
  @Patch(':projectId/environments/:environmentId')
  @RequireProjectMember()
  @ProjectPermissions(['project:write'])
  async updateProjectEnvironment(
    @Param('projectId') projectId: string,
    @Param('environmentId') environmentId: string,
    @Body() dto: UpdateProjectEnvReqDto,
    @ReqUser('id') userId: string,
  ): Promise<ProjectEnvDto> {
    const result = await this.projectEnvService.updateProjectEnv(dto, projectId, environmentId, userId)
    return plainToInstance(ProjectEnvDto, result)
  }

  /** 设置某个项目环境为默认环境 */
  @Post(':projectId/environments/:environmentId/default')
  @RequireProjectMember()
  @ProjectPermissions(['project:write'])
  @ResMsg('默认环境设置成功')
  async setProjectEnvironmentAsDefault(
    @Param('projectId') projectId: string,
    @Param('environmentId') environmentId: string,
    @ReqUser('id') userId: string,
  ): Promise<ProjectEnvDto> {
    const result = await this.projectEnvService.setProjectEnvAsDefault(projectId, environmentId, userId)
    return plainToInstance(ProjectEnvDto, result)
  }

  /** 删除项目环境 */
  @Delete(':projectId/environments/:environmentId')
  @RequireProjectMember()
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
