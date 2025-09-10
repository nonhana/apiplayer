import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { TeamPermissions } from '@/common/decorators/permissions.decorator'
import { ReqUser } from '@/common/decorators/req-user.decorator'
import { ResMsg } from '@/common/decorators/res-msg.decorator'
import { BasePaginatedQueryDto } from '@/common/dto/pagination.dto'
import { AuthGuard } from '@/common/guards/auth.guard'
import { PermissionsGuard } from '@/common/guards/permissions.guard'
import { CreateTeamReqDto, TeamDetailDto, TeamDto, TeamsDto, UpdateTeamReqDto } from './dto'
import { TeamService } from './team.service'

@Controller('teams')
@UseGuards(AuthGuard, PermissionsGuard)
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  /**
   * 创建团队
   * 任何登录用户都可以创建团队
   */
  @Post()
  async createTeam(
    @Body() createTeamDto: CreateTeamReqDto,
    @ReqUser('id') userId: string,
  ): Promise<TeamDto> {
    const newTeam = await this.teamService.createTeam(createTeamDto, userId)
    return plainToInstance(TeamDto, newTeam)
  }

  /**
   * 获取用户的团队列表
   * 只需要登录即可查看自己的团队
   */
  @Get()
  async getUserTeams(
    @Query() query: BasePaginatedQueryDto,
    @ReqUser('id') userId: string,
  ) {
    const result = await this.teamService.getUserTeams(userId, query)
    return plainToInstance(TeamsDto, result)
  }

  /**
   * 获取团队详情
   * 需要是团队成员才能查看详情
   */
  @Get(':teamId')
  @TeamPermissions(['team:read'])
  async getTeamDetail(
    @Param('teamId') teamId: string,
    @ReqUser('id') userId: string,
  ): Promise<TeamDetailDto> {
    const teamDetail = await this.teamService.getTeamDetail(teamId, userId)
    return plainToInstance(TeamDetailDto, teamDetail)
  }

  /**
   * 更新团队信息
   * 需要团队写入权限
   */
  @Patch(':teamId')
  @TeamPermissions(['team:write'])
  async updateTeam(
    @Param('teamId') teamId: string,
    @Body() updateTeamDto: UpdateTeamReqDto,
    @ReqUser('id') userId: string,
  ): Promise<TeamDto> {
    const updatedTeam = await this.teamService.updateTeam(teamId, updateTeamDto, userId)
    return plainToInstance(TeamDto, updatedTeam)
  }

  /**
   * 删除团队
   * 需要团队管理权限
   */
  @Delete(':teamId')
  @TeamPermissions(['team:admin'])
  @ResMsg('团队删除成功')
  async deleteTeam(
    @Param('teamId') teamId: string,
    @ReqUser('id') userId: string,
  ): Promise<void> {
    await this.teamService.deleteTeam(teamId, userId)
  }
}
