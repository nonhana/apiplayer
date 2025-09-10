import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { ProjectPermissions } from '@/common/decorators/permissions.decorator'
import { ReqUser } from '@/common/decorators/req-user.decorator'
import { ResMsg } from '@/common/decorators/res-msg.decorator'
import { MemberDto, MembersDto } from '@/common/dto/member.dto'
import { AuthGuard } from '@/common/guards/auth.guard'
import { PermissionsGuard } from '@/common/guards/permissions.guard'
import { GetMembersReqDto, InviteMemberReqDto, UpdateMemberReqDto } from './dto'
import { ProjectMemberService } from './project-member.service'

@Controller('projects')
@UseGuards(AuthGuard, PermissionsGuard)
export class ProjectMemberController {
  constructor(
    private readonly projectMemberService: ProjectMemberService,
  ) {}

  /**
   * 邀请项目成员
   */
  @Post(':projectId/members')
  @ProjectPermissions(['project:member:invite'])
  async inviteProjectMember(
    @Param('projectId') projectId: string,
    @Body() inviteDto: InviteMemberReqDto,
    @ReqUser('id') userId: string,
  ): Promise<MemberDto> {
    const newMember = await this.projectMemberService.inviteProjectMember(projectId, inviteDto, userId)
    return plainToInstance(MemberDto, newMember)
  }

  /**
   * 获取项目成员列表
   */
  @Get(':projectId/members')
  @ProjectPermissions(['project:read'])
  async getProjectMembers(
    @Param('projectId') projectId: string,
    @Query() query: GetMembersReqDto,
    @ReqUser('id') userId: string,
  ): Promise<MembersDto> {
    const result = await this.projectMemberService.getProjectMembers(projectId, userId, query)
    return plainToInstance(MembersDto, result)
  }

  /**
   * 更新项目成员角色
   */
  @Patch(':projectId/members/:memberId')
  @ProjectPermissions(['project:member:manage'])
  async updateProjectMemberRole(
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
    @Body() updateDto: UpdateMemberReqDto,
    @ReqUser('id') userId: string,
  ): Promise<MemberDto> {
    const updatedMember = await this.projectMemberService.updateProjectMember(projectId, memberId, updateDto, userId)
    return plainToInstance(MemberDto, updatedMember)
  }

  /**
   * 移除项目成员
   */
  @Delete(':projectId/members/:memberId')
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
