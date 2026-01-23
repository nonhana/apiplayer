import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { ProjectPermissions, RequireProjectMember } from '@/common/decorators/permissions.decorator'
import { ReqUser } from '@/common/decorators/req-user.decorator'
import { ResMsg } from '@/common/decorators/res-msg.decorator'
import { MemberDto, MembersDto } from '@/common/dto/member.dto'
import { AuthGuard } from '@/common/guards/auth.guard'
import { PermissionsGuard } from '@/common/guards/permissions.guard'
import { GetMembersReqDto, InviteMembersReqDto, UpdateProjectMemberReqDto } from './dto'
import { ProjectMemberService } from './project-member.service'

@Controller('projects')
@UseGuards(AuthGuard, PermissionsGuard)
export class ProjectMemberController {
  constructor(
    private readonly projectMemberService: ProjectMemberService,
  ) {}

  /** 邀请项目成员 */
  @Post(':projectId/members')
  @RequireProjectMember()
  @ProjectPermissions(['project:member:invite'])
  async inviteProjectMembers(
    @Param('projectId') projectId: string,
    @Body() dto: InviteMembersReqDto,
    @ReqUser('id') userId: string,
  ): Promise<MemberDto[]> {
    const result = await this.projectMemberService.inviteProjectMembers(dto, projectId, userId)
    return plainToInstance(MemberDto, result)
  }

  /** 分页获取项目成员列表 */
  @Get(':projectId/members')
  @RequireProjectMember()
  @ProjectPermissions(['project:read'])
  async getProjectMembers(
    @Param('projectId') projectId: string,
    @Query() dto: GetMembersReqDto,
  ): Promise<MembersDto> {
    const result = await this.projectMemberService.getProjectMembers(dto, projectId)
    return plainToInstance(MembersDto, result)
  }

  /** 获取全部项目成员列表 */
  @Get(':projectId/members/all')
  @RequireProjectMember()
  @ProjectPermissions(['project:read'])
  async getAllProjectMembers(
    @Param('projectId') projectId: string,
  ): Promise<MemberDto[]> {
    const result = await this.projectMemberService.getAllProjectMembers(projectId)
    return plainToInstance(MemberDto, result)
  }

  /** 更新项目成员角色 */
  @Patch(':projectId/members/:memberId')
  @RequireProjectMember()
  @ProjectPermissions(['project:member:manage'])
  async updateProjectMemberRole(
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateProjectMemberReqDto,
    @ReqUser('id') userId: string,
  ): Promise<MemberDto> {
    const result = await this.projectMemberService.updateProjectMember(dto, projectId, memberId, userId)
    return plainToInstance(MemberDto, result)
  }

  /** 移除项目成员 */
  @Delete(':projectId/members/:memberId')
  @RequireProjectMember()
  @ProjectPermissions(['project:member:remove'])
  @ResMsg('项目成员移除成功')
  async removeProjectMember(
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
    @ReqUser('id') userId: string,
  ): Promise<void> {
    await this.projectMemberService.removeProjectMember(projectId, memberId, userId)
  }
}
