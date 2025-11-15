import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { ProjectPermissions } from '@/common/decorators/permissions.decorator'
import { ReqUser } from '@/common/decorators/req-user.decorator'
import { ResMsg } from '@/common/decorators/res-msg.decorator'
import { AuthGuard } from '@/common/guards/auth.guard'
import { PermissionsGuard } from '@/common/guards/permissions.guard'
import {
  CreateApiGroupReqDto,
  GetGroupTreeWithApisReqDto,
  GroupBriefDto,
  GroupTreeNodeDto,
  GroupTreeWithApisNodeDto,
} from './dto/group.dto'
import { GroupService } from './group.service'

@Controller('api')
@UseGuards(AuthGuard, PermissionsGuard)
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  // 7) 创建分组
  @Post(':projectId/api-groups')
  @ProjectPermissions(['api_group:create'])
  @ResMsg('分组创建成功')
  async createGroup(
    @Param('projectId') projectId: string,
    @Body() dto: CreateApiGroupReqDto,
    @ReqUser('id') userId: string,
  ): Promise<GroupBriefDto> {
    const created = await this.groupService.createGroup(dto, projectId, userId)
    return plainToInstance(GroupBriefDto, created)
  }

  // 8) 获取分组树（含子分组与每组 API 统计）
  @Get(':projectId/api-groups/tree')
  @ProjectPermissions(['api_group:read'])
  @ResMsg('分组树获取成功')
  async getGroupTree(
    @Param('projectId') projectId: string,
    @ReqUser('id') userId: string,
  ): Promise<GroupTreeNodeDto[]> {
    const tree = await this.groupService.getGroupTree(projectId, userId)
    return plainToInstance(GroupTreeNodeDto, tree)
  }

  // 9) 获取分组树（含 API 聚合）
  @Get(':projectId/api-groups/tree-with-apis')
  @ProjectPermissions(['api_group:read'])
  @ResMsg('分组树（含 API）获取成功')
  async getGroupTreeWithApis(
    @Param('projectId') projectId: string,
    @Query() query: GetGroupTreeWithApisReqDto,
    @ReqUser('id') userId: string,
  ): Promise<GroupTreeWithApisNodeDto[]> {
    const tree = await this.groupService.getGroupTreeWithApis(query, projectId, userId)
    return plainToInstance(GroupTreeWithApisNodeDto, tree)
  }
}
