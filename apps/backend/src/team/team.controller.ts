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
import { TeamPermissions } from '@/common/decorators/permissions.decorator'
import { AuthGuard } from '@/common/guards/auth.guard'
import { PermissionsGuard } from '@/common/guards/permissions.guard'
import {
  CreateTeamDto,
  CreateTeamResponseDto,
  DeleteTeamResponseDto,
  InviteTeamMemberDto,
  InviteTeamMemberResponseDto,
  RemoveTeamMemberResponseDto,
  TeamDetailResponseDto,
  TeamListQueryDto,
  TeamListResponseDto,
  TeamMembersResponseDto,
  UpdateTeamDto,
  UpdateTeamMemberResponseDto,
  UpdateTeamMemberRoleDto,
  UpdateTeamResponseDto,
} from './dto'
import { TeamService } from './team.service'

@Controller('teams')
@UseGuards(AuthGuard, PermissionsGuard)
export class TeamController {
  constructor(
    private readonly teamService: TeamService,
  ) {}

  /**
   * 创建团队
   * 任何登录用户都可以创建团队
   */
  @Post()
  async createTeam(
    @Body() createTeamDto: CreateTeamDto,
    @Req() request: FastifyRequest,
  ): Promise<CreateTeamResponseDto> {
    const user = request.user!
    return await this.teamService.createTeam(createTeamDto, user.id)
  }

  /**
   * 获取用户的团队列表
   * 只需要登录即可查看自己的团队
   */
  @Get()
  async getUserTeams(
    @Query() query: TeamListQueryDto,
    @Req() request: FastifyRequest,
  ): Promise<TeamListResponseDto> {
    const user = request.user!
    return await this.teamService.getUserTeams(user.id, query)
  }

  /**
   * 获取团队详情
   * 需要是团队成员才能查看详情
   */
  @Get(':teamId')
  @TeamPermissions(['team:read'])
  async getTeamDetail(
    @Param('teamId') teamId: string,
    @Req() request: FastifyRequest,
  ): Promise<TeamDetailResponseDto> {
    const user = request.user!
    const teamDetail = await this.teamService.getTeamDetail(teamId, user.id)
    return { team: teamDetail }
  }

  /**
   * 更新团队信息
   * 需要团队写入权限
   */
  @Patch(':teamId')
  @TeamPermissions(['team:write'])
  async updateTeam(
    @Param('teamId') teamId: string,
    @Body() updateTeamDto: UpdateTeamDto,
    @Req() request: FastifyRequest,
  ): Promise<UpdateTeamResponseDto> {
    const user = request.user!
    return await this.teamService.updateTeam(teamId, updateTeamDto, user.id)
  }

  /**
   * 删除团队
   * 需要团队管理权限
   */
  @Delete(':teamId')
  @TeamPermissions(['team:admin'])
  async deleteTeam(
    @Param('teamId') teamId: string,
    @Req() request: FastifyRequest,
  ): Promise<DeleteTeamResponseDto> {
    const user = request.user!
    const result = await this.teamService.deleteTeam(teamId, user.id)
    return {
      message: result.message,
      deletedTeamId: result.deletedTeamId,
    }
  }

  // ==================== 团队成员管理 ====================

  /**
   * 邀请团队成员
   * 需要成员邀请权限
   */
  @Post(':teamId/members')
  @TeamPermissions(['team:member:invite'])
  async inviteTeamMember(
    @Param('teamId') teamId: string,
    @Body() inviteDto: InviteTeamMemberDto,
    @Req() request: FastifyRequest,
  ): Promise<InviteTeamMemberResponseDto> {
    const user = request.user!
    return await this.teamService.inviteTeamMember(teamId, inviteDto, user.id)
  }

  /**
   * 获取团队成员列表
   * 需要团队读取权限
   */
  @Get(':teamId/members')
  @TeamPermissions(['team:read'])
  async getTeamMembers(
    @Param('teamId') teamId: string,
    @Query() query: TeamListQueryDto,
    @Req() request: FastifyRequest,
  ): Promise<TeamMembersResponseDto> {
    const user = request.user!
    return await this.teamService.getTeamMembers(teamId, user.id, query)
  }

  /**
   * 更新团队成员角色
   * 需要成员管理权限
   */
  @Patch(':teamId/members/:memberId')
  @TeamPermissions(['team:member:manage'])
  async updateTeamMemberRole(
    @Param('teamId') teamId: string,
    @Param('memberId') memberId: string,
    @Body() updateDto: UpdateTeamMemberRoleDto,
    @Req() request: FastifyRequest,
  ): Promise<UpdateTeamMemberResponseDto> {
    const user = request.user!
    return await this.teamService.updateTeamMemberRole(teamId, memberId, updateDto, user.id)
  }

  /**
   * 移除团队成员
   * 需要成员移除权限
   */
  @Delete(':teamId/members/:memberId')
  @TeamPermissions(['team:member:remove'])
  async removeTeamMember(
    @Param('teamId') teamId: string,
    @Param('memberId') memberId: string,
    @Req() request: FastifyRequest,
  ): Promise<RemoveTeamMemberResponseDto> {
    const user = request.user!
    return await this.teamService.removeTeamMember(teamId, memberId, user.id)
  }

  // ==================== 辅助接口 ====================

  /**
   * 获取当前用户在团队中的角色和权限
   * 用于前端权限控制
   */
  @Get(':teamId/my-role')
  @TeamPermissions(['team:read'])
  async getMyTeamRole(
    @Param('teamId') teamId: string,
    @Req() request: FastifyRequest,
  ): Promise<{ role: any, permissions: string[] }> {
    const user = request.user!
    return await this.teamService.getUserTeamRole(teamId, user.id)
  }
}
