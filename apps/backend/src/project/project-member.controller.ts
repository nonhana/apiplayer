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
import { FastifyRequest } from 'fastify'
import { ProjectPermissions } from '@/common/decorators/permissions.decorator'
import { AuthGuard } from '@/common/guards/auth.guard'
import { PermissionsGuard } from '@/common/guards/permissions.guard'
import {
  InviteProjectMemberDto,
  InviteProjectMemberResponseDto,
  ProjectListQueryDto,
  ProjectMembersResponseDto,
  RemoveProjectMemberResponseDto,
  UpdateProjectMemberResponseDto,
  UpdateProjectMemberRoleDto,
} from './old-dto'
import { ProjectMemberService } from './project-member.service'

@Controller('projects')
@UseGuards(AuthGuard, PermissionsGuard)
export class ProjectMemberController {
  constructor(
    private readonly projectMemberService: ProjectMemberService,
  ) {}

  /**
   * 邀请项目成员
   * 需要项目成员邀请权限
   */
  @Post(':projectId/members')
  @ProjectPermissions(['project:member:invite'])
  async inviteProjectMember(
    @Param('projectId') projectId: string,
    @Body() inviteDto: InviteProjectMemberDto,
    @Req() request: FastifyRequest,
  ): Promise<InviteProjectMemberResponseDto> {
    const user = request.user!
    return await this.projectMemberService.inviteProjectMember(projectId, inviteDto, user.id)
  }

  /**
   * 获取项目成员列表
   * 需要项目读取权限
   */
  @Get(':projectId/members')
  @ProjectPermissions(['project:read'])
  async getProjectMembers(
    @Param('projectId') projectId: string,
    @Query() query: ProjectListQueryDto,
    @Req() request: FastifyRequest,
  ): Promise<ProjectMembersResponseDto> {
    const user = request.user!
    return await this.projectMemberService.getProjectMembers(projectId, user.id, query)
  }

  /**
   * 更新项目成员角色
   * 需要项目成员管理权限
   */
  @Patch(':projectId/members/:memberId')
  @ProjectPermissions(['project:member:manage'])
  async updateProjectMemberRole(
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
    @Body() updateDto: UpdateProjectMemberRoleDto,
    @Req() request: FastifyRequest,
  ): Promise<UpdateProjectMemberResponseDto> {
    const user = request.user!
    return await this.projectMemberService.updateProjectMemberRole(projectId, memberId, updateDto, user.id)
  }

  /**
   * 移除项目成员
   * 需要项目成员移除权限
   */
  @Delete(':projectId/members/:memberId')
  @ProjectPermissions(['project:member:remove'])
  async removeProjectMember(
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
    @Req() request: FastifyRequest,
  ): Promise<RemoveProjectMemberResponseDto> {
    const user = request.user!
    return await this.projectMemberService.removeProjectMember(projectId, memberId, user.id)
  }
}
