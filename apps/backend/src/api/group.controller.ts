import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { ProjectPermissions, RequireProjectMember } from '@/common/decorators/permissions.decorator'
import { ReqUser } from '@/common/decorators/req-user.decorator'
import { ResMsg } from '@/common/decorators/res-msg.decorator'
import { AuthGuard } from '@/common/guards/auth.guard'
import { PermissionsGuard } from '@/common/guards/permissions.guard'
import {
  CreateGroupReqDto,
  DeleteGroupReqDto,
  GetGroupWithAPIReqDto,
  GroupBriefDto,
  GroupNodeDto,
  GroupNodeWithAPIDto,
  MoveGroupReqDto,
  SortItemsReqDto,
  UpdateGroupReqDto,
} from './dto'
import { GroupService } from './group.service'

@Controller('api')
@UseGuards(AuthGuard, PermissionsGuard)
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  /** 创建 API 分组 */
  @Post(':projectId/api-groups')
  @RequireProjectMember()
  @ProjectPermissions(['api_group:create'], 'projectId')
  @ResMsg('分组创建成功')
  async createGroup(
    @Param('projectId') projectId: string,
    @Body() dto: CreateGroupReqDto,
    @ReqUser('id') userId: string,
  ): Promise<GroupBriefDto> {
    const result = await this.groupService.createGroup(dto, projectId, userId)
    return plainToInstance(GroupBriefDto, result)
  }

  /** 获取分组树 */
  @Get(':projectId/api-groups/tree')
  @RequireProjectMember()
  @ProjectPermissions(['project:read'])
  @ResMsg('分组树获取成功')
  async getGroupTree(
    @Param('projectId') projectId: string,
  ): Promise<GroupNodeDto[]> {
    const result = await this.groupService.getGroupTree(projectId)
    return plainToInstance(GroupNodeDto, result)
  }

  /** 获取分组树（含 API） */
  @Get(':projectId/api-groups/tree-with-apis')
  @RequireProjectMember()
  @ProjectPermissions(['api_group:read'], 'projectId')
  @ResMsg('分组树（含 API）获取成功')
  async getGroupTreeWithApis(
    @Param('projectId') projectId: string,
    @Query() dto: GetGroupWithAPIReqDto,
  ): Promise<GroupNodeWithAPIDto[]> {
    const result = await this.groupService.getGroupTreeWithApis(dto, projectId)
    return plainToInstance(GroupNodeWithAPIDto, result)
  }

  /** 更新分组 */
  @Patch(':projectId/api-groups/:groupId')
  @RequireProjectMember()
  @ProjectPermissions(['api_group:write'])
  @ResMsg('分组更新成功')
  async updateGroup(
    @Param('projectId') projectId: string,
    @Param('groupId') groupId: string,
    @Body() dto: UpdateGroupReqDto,
    @ReqUser('id') userId: string,
  ): Promise<GroupBriefDto> {
    const result = await this.groupService.updateGroup(dto, groupId, projectId, userId)
    return plainToInstance(GroupBriefDto, result)
  }

  /** 移动分组 */
  @Post(':projectId/api-groups/:groupId/move')
  @RequireProjectMember()
  @ProjectPermissions(['api_group:write'])
  @ResMsg('分组移动成功')
  async moveGroup(
    @Param('projectId') projectId: string,
    @Param('groupId') groupId: string,
    @Body() dto: MoveGroupReqDto,
    @ReqUser('id') userId: string,
  ): Promise<GroupBriefDto> {
    const result = await this.groupService.moveGroup(dto, groupId, projectId, userId)
    return plainToInstance(GroupBriefDto, result)
  }

  /** 删除分组 */
  @Delete(':projectId/api-groups/:groupId')
  @RequireProjectMember()
  @ProjectPermissions(['api_group:delete'])
  @ResMsg('分组删除成功')
  async deleteGroup(
    @Param('projectId') projectId: string,
    @Param('groupId') groupId: string,
    @Query() dto: DeleteGroupReqDto,
    @ReqUser('id') userId: string,
  ): Promise<void> {
    await this.groupService.deleteGroup(dto, groupId, projectId, userId)
  }

  /** 批量更新分组排序 */
  @Post(':projectId/api-groups/sort')
  @RequireProjectMember()
  @ProjectPermissions(['api_group:write'])
  @ResMsg('分组排序更新成功')
  async sortGroups(
    @Param('projectId') projectId: string,
    @Body() dto: SortItemsReqDto,
    @ReqUser('id') userId: string,
  ): Promise<void> {
    await this.groupService.sortGroups(dto, projectId, userId)
  }
}
