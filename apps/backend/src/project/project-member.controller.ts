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
import { MemberDto, MembersDto } from '@/common/dto/member.dto'
import { AuthGuard } from '@/common/guards/auth.guard'
import { PermissionsGuard } from '@/common/guards/permissions.guard'
import { GetMembersDto } from './dto/get-members.dto'
import { InviteMemberDto } from './dto/invite-member.dto'
import { RemoveMemberResDto } from './dto/remove-member.dto'
import { UpdateMemberDto } from './dto/update-member.dto'
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
    @Body() inviteDto: InviteMemberDto,
    @Req() request: FastifyRequest,
  ): Promise<MemberDto> {
    const user = request.user!
    const newMember = await this.projectMemberService.inviteProjectMember(projectId, inviteDto, user.id)
    return plainToInstance(MemberDto, newMember)
  }

  /**
   * 获取项目成员列表
   * 需要项目读取权限
   */
  @Get(':projectId/members')
  @ProjectPermissions(['project:read'])
  async getProjectMembers(
    @Param('projectId') projectId: string,
    @Query() query: GetMembersDto,
    @Req() request: FastifyRequest,
  ): Promise<MembersDto> {
    const user = request.user!
    const result = await this.projectMemberService.getProjectMembers(projectId, user.id, query)
    return plainToInstance(MembersDto, result)
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
    @Body() updateDto: UpdateMemberDto,
    @Req() request: FastifyRequest,
  ): Promise<MemberDto> {
    const user = request.user!
    const updatedMember = await this.projectMemberService.updateProjectMember(projectId, memberId, updateDto, user.id)
    return plainToInstance(MemberDto, updatedMember)
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
  ): Promise<RemoveMemberResDto> {
    const user = request.user!
    return await this.projectMemberService.removeProjectMember(projectId, memberId, user.id)
  }
}
