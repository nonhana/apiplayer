import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { FastifyRequest } from 'fastify'
import { Permissions } from '@/common/decorators/permissions.decorator'
import { AuthGuard } from '@/common/guards/auth.guard'
import { PermissionsGuard } from '@/common/guards/permissions.guard'
import {
  CreateProjectDto,
  CreateProjectResponseDto,
  DeleteProjectResponseDto,
  ProjectDetailResponseDto,
  ProjectListQueryDto,
  ProjectListResponseDto,
  RecentlyProjectsResponseDto,
  UpdateProjectDto,
  UpdateProjectResponseDto,
} from './dto'
import { ProjectService } from './project.service'

@Controller('projects')
@UseGuards(AuthGuard, PermissionsGuard)
export class ProjectController {
  @Inject(ProjectService)
  private readonly projectService: ProjectService

  /**
   * 创建项目
   * 需要项目创建权限
   */
  @Post(':teamId')
  @Permissions('project:create')
  async createProject(
    @Param('teamId') teamId: string,
    @Body() createProjectDto: CreateProjectDto,
    @Req() request: FastifyRequest,
  ): Promise<CreateProjectResponseDto> {
    const user = request.user!
    return await this.projectService.createProject(teamId, createProjectDto, user.id)
  }

  /**
   * 获取用户的项目列表
   * 只需要登录即可查看自己的项目
   */
  @Get()
  async getUserProjects(
    @Query() query: ProjectListQueryDto,
    @Req() request: FastifyRequest,
  ): Promise<ProjectListResponseDto> {
    const user = request.user!
    return await this.projectService.getUserProjects(user.id, query)
  }

  /**
   * 获取项目详情
   * 需要是项目成员才能查看详情
   */
  @Get(':projectId')
  @Permissions('project:read')
  async getProjectDetail(
    @Param('projectId') projectId: string,
    @Req() request: FastifyRequest,
  ): Promise<ProjectDetailResponseDto> {
    const user = request.user!
    const projectDetail = await this.projectService.getProjectDetail(projectId, user.id)
    return { project: projectDetail }
  }

  /**
   * 更新项目信息
   * 需要项目写入权限
   */
  @Patch(':projectId')
  @Permissions('project:write')
  async updateProject(
    @Param('projectId') projectId: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @Req() request: FastifyRequest,
  ): Promise<UpdateProjectResponseDto> {
    const user = request.user!
    return await this.projectService.updateProject(projectId, updateProjectDto, user.id)
  }

  /**
   * 删除项目
   * 需要项目管理权限
   */
  @Delete(':projectId')
  @Permissions('project:admin')
  async deleteProject(
    @Param('projectId') projectId: string,
    @Req() request: FastifyRequest,
  ): Promise<DeleteProjectResponseDto> {
    const user = request.user!
    return await this.projectService.deleteProject(projectId, user.id)
  }

  /**
   * 获取用户最近访问的项目
   * 只需要登录即可
   */
  @Get('recently/visited')
  async getRecentlyProjects(
    @Req() request: FastifyRequest,
  ): Promise<RecentlyProjectsResponseDto> {
    const user = request.user!
    return await this.projectService.getRecentlyProjects(user.id)
  }

  /**
   * 获取当前用户在项目中的角色和权限
   * 用于前端权限控制
   */
  @Get(':projectId/my-role')
  @Permissions('project:read')
  async getMyProjectRole(
    @Param('projectId') projectId: string,
    @Req() request: FastifyRequest,
  ): Promise<{ role: any, permissions: string[] }> {
    const user = request.user!
    return await this.projectService.getUserProjectRole(projectId, user.id)
  }
}
