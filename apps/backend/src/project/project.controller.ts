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
import { CreateProjectDto, CreateProjectResDto } from './dto/create-project.dto'
import { DeleteProjectResDto } from './dto/delete-project.dto'
import { GetPermissionsResDto } from './dto/get-permissions.dto'
import { ProjectDetailDto } from './dto/project.dto'
import { ProjectsDto } from './dto/projects.dto'
import { QueryProjectsDto } from './dto/query-projects.dto'
import { RecentlyProjectsResDto } from './dto/recent-projects.dto'
import { UpdateProjectDto, UpdateProjectResDto } from './dto/update-project.dto'
import { ProjectService } from './project.service'

@Controller('projects')
@UseGuards(AuthGuard, PermissionsGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  /**
   * 创建项目
   * 需要项目创建权限
   */
  @Post(':teamId')
  @ProjectPermissions(['project:create'])
  @ResMsg('项目创建成功')
  async createProject(
    @Param('teamId') teamId: string,
    @Body() createProjectDto: CreateProjectDto,
    @Req() request: FastifyRequest,
  ): Promise<CreateProjectResDto> {
    const user = request.user!
    const result = await this.projectService.createProject(teamId, createProjectDto, user.id)
    return plainToInstance(CreateProjectResDto, result)
  }

  /**
   * 获取用户的项目列表
   * 只需要登录即可查看自己的项目
   */
  @Get()
  async getUserProjects(
    @Query() query: QueryProjectsDto,
    @Req() request: FastifyRequest,
  ): Promise<ProjectsDto> {
    const user = request.user!
    const result = await this.projectService.getUserProjects(user.id, query)
    return plainToInstance(ProjectsDto, result)
  }

  /**
   * 获取项目详情
   * 需要是项目成员才能查看详情
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
   * 需要项目写入权限
   */
  @Patch(':projectId')
  @ProjectPermissions(['project:write'])
  @ResMsg('项目更新成功')
  async updateProject(
    @Param('projectId') projectId: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @Req() request: FastifyRequest,
  ): Promise<UpdateProjectResDto> {
    const user = request.user!
    const result = await this.projectService.updateProject(projectId, updateProjectDto, user.id)
    return plainToInstance(UpdateProjectResDto, result)
  }

  /**
   * 删除项目
   * 需要项目管理权限
   */
  @Delete(':projectId')
  @ProjectPermissions(['project:admin'])
  @ResMsg('项目删除成功')
  async deleteProject(
    @Param('projectId') projectId: string,
    @Req() request: FastifyRequest,
  ): Promise<DeleteProjectResDto> {
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
  ): Promise<RecentlyProjectsResDto> {
    const user = request.user!
    const result = await this.projectService.getRecentlyProjects(user.id)
    return plainToInstance(RecentlyProjectsResDto, result)
  }

  /**
   * 获取当前用户在项目中的角色和权限
   * 用于前端权限控制
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
