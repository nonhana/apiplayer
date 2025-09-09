import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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

  /**
   * 创建项目
   */
  @Post(':teamId')
  @ProjectPermissions(['project:create'])
  @ResMsg('项目创建成功')
  async createProject(
    @Param('teamId') teamId: string,
    @Body() createProjectDto: CreateProjectReqDto,
    @Req() request: FastifyRequest,
  ): Promise<ProjectBriefDto> {
    const user = request.user!
    const result = await this.projectService.createProject(teamId, createProjectDto, user.id)
    return plainToInstance(ProjectBriefDto, result)
  }

  /**
   * 获取用户的项目列表
   */
  @Get()
  async getUserProjects(
    @Query() query: GetProjectsReqDto,
    @Req() request: FastifyRequest,
  ): Promise<ProjectsDto> {
    const user = request.user!
    const result = await this.projectService.getUserProjects(user.id, query)
    return plainToInstance(ProjectsDto, result)
  }

  /**
   * 获取项目详情
   */
  @Get(':projectId')
  @ProjectPermissions(['project:read'])
  async getProjectDetail(
    @Param('projectId') projectId: string,
    @Req() request: FastifyRequest,
  ): Promise<ProjectDetailDto> {
    const user = request.user!
    const projectDetail = await this.projectService.getProjectDetail(projectId, user.id)
    return plainToInstance(ProjectDetailDto, projectDetail)
  }

  /**
   * 更新项目信息
   */
  @Patch(':projectId')
  @ProjectPermissions(['project:write'])
  @ResMsg('项目更新成功')
  async updateProject(
    @Param('projectId') projectId: string,
    @Body() updateProjectDto: UpdateProjectReqDto,
    @Req() request: FastifyRequest,
  ): Promise<ProjectBriefDto> {
    const user = request.user!
    const result = await this.projectService.updateProject(projectId, updateProjectDto, user.id)
    return plainToInstance(ProjectBriefDto, result)
  }

  /**
   * 删除项目
   */
  @Delete(':projectId')
  @ProjectPermissions(['project:admin'])
  @ResMsg('项目删除成功')
  async deleteProject(
    @Param('projectId') projectId: string,
    @Req() request: FastifyRequest,
  ): Promise<void> {
    const user = request.user!
    await this.projectService.deleteProject(projectId, user.id)
  }

  /**
   * 获取用户最近访问的项目
   */
  @Get('recently/visited')
  async getRecentlyProjects(
    @Req() request: FastifyRequest,
  ): Promise<RecentProjectItemDto[]> {
    const user = request.user!
    const result = await this.projectService.getRecentlyProjects(user.id)
    return plainToInstance(RecentProjectItemDto, result)
  }

  /**
   * 获取当前用户在项目中的角色和权限
   */
  @Get(':projectId/my-role')
  @ProjectPermissions(['project:read'])
  async getMyProjectRole(
    @Param('projectId') projectId: string,
    @Req() request: FastifyRequest,
  ): Promise<GetPermissionsResDto> {
    const user = request.user!
    const result = await this.projectService.getUserProjectRole(projectId, user.id)
    return plainToInstance(GetPermissionsResDto, result)
  }
}
