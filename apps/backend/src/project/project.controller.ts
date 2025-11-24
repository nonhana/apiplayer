import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { ProjectPermissions, RequireProjectMember, RequireTeamMember } from '@/common/decorators/permissions.decorator'
import { ReqUser } from '@/common/decorators/req-user.decorator'
import { ResMsg } from '@/common/decorators/res-msg.decorator'
import { AuthGuard } from '@/common/guards/auth.guard'
import { PermissionsGuard } from '@/common/guards/permissions.guard'
import {
  CreateProjectReqDto,
  GetPermissionsResDto,
  GetProjectsReqDto,
  ProjectBriefDto,
  ProjectDetailDto,
  ProjectsDto,
  RecentProjectItemDto,
  UpdateProjectReqDto,
} from './dto'
import { ProjectService } from './project.service'

@Controller('projects')
@UseGuards(AuthGuard, PermissionsGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  /** 创建项目 */
  @Post(':teamId')
  @RequireTeamMember()
  @ProjectPermissions(['project:create'], 'teamId')
  @ResMsg('项目创建成功')
  async createProject(
    @Param('teamId') teamId: string,
    @Body() dto: CreateProjectReqDto,
    @ReqUser('id') userId: string,
  ): Promise<ProjectBriefDto> {
    const result = await this.projectService.createProject(dto, teamId, userId)
    return plainToInstance(ProjectBriefDto, result)
  }

  /** 获取用户的项目列表 */
  @Get()
  async getUserProjects(
    @Query() dto: GetProjectsReqDto,
    @ReqUser('id') userId: string,
  ): Promise<ProjectsDto> {
    const result = await this.projectService.getUserProjects(dto, userId)
    return plainToInstance(ProjectsDto, result)
  }

  /** 获取项目详情 */
  @Get(':projectId')
  @RequireProjectMember()
  @ProjectPermissions(['project:read'])
  async getProjectDetail(
    @Param('projectId') projectId: string,
    @ReqUser('id') userId: string,
  ): Promise<ProjectDetailDto> {
    const result = await this.projectService.getProjectDetail(projectId, userId)
    return plainToInstance(ProjectDetailDto, result)
  }

  /** 更新项目 */
  @Patch(':projectId')
  @RequireProjectMember()
  @ProjectPermissions(['project:write'])
  @ResMsg('项目更新成功')
  async updateProject(
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectReqDto,
    @ReqUser('id') userId: string,
  ): Promise<ProjectBriefDto> {
    const result = await this.projectService.updateProject(dto, projectId, userId)
    return plainToInstance(ProjectBriefDto, result)
  }

  /** 删除项目 */
  @Delete(':projectId')
  @RequireProjectMember()
  @ProjectPermissions(['project:admin'])
  @ResMsg('项目删除成功')
  async deleteProject(
    @Param('projectId') projectId: string,
    @ReqUser('id') userId: string,
  ): Promise<void> {
    await this.projectService.deleteProject(projectId, userId)
  }

  /** 获取最近访问项目 */
  @Get('recently/visited')
  async getRecentlyProjects(
    @ReqUser('id') userId: string,
  ): Promise<RecentProjectItemDto[]> {
    const result = await this.projectService.getRecentlyProjects(userId)
    return plainToInstance(RecentProjectItemDto, result)
  }

  /** 获取我的项目角色 */
  @Get(':projectId/my-role')
  @RequireProjectMember()
  @ProjectPermissions(['project:read'])
  async getMyProjectRole(
    @Param('projectId') projectId: string,
    @ReqUser('id') userId: string,
  ): Promise<GetPermissionsResDto> {
    const result = await this.projectService.getUserProjectRole(projectId, userId)
    return plainToInstance(GetPermissionsResDto, result)
  }
}
