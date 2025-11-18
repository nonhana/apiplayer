import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { ProjectPermissions } from '@/common/decorators/permissions.decorator'
import { ReqUser } from '@/common/decorators/req-user.decorator'
import { ResMsg } from '@/common/decorators/res-msg.decorator'
import { AuthGuard } from '@/common/guards/auth.guard'
import { PermissionsGuard } from '@/common/guards/permissions.guard'
import { CreateGroupReqDto } from './dto/create-group.dto'
import { DeleteGroupReqDto } from './dto/delete-group.dto'
import { GetGroupWithAPIReqDto } from './dto/get-groups.dto'
import {
  GroupBriefDto,
  GroupNodeDto,
  GroupNodeWithAPIDto,
} from './dto/group.dto'
import { MoveGroupReqDto } from './dto/move-group.dto'
import { SortItemsReqDto } from './dto/sort-items.dto'
import { UpdateGroupReqDto } from './dto/update-group.dto'
import { GroupService } from './group.service'

@Controller('api')
@UseGuards(AuthGuard, PermissionsGuard)
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  /** 创建 API 分组 */
  @Post(':projectId/api-groups')
  @ProjectPermissions(['api_group:create'], 'projectId')
  @ResMsg('分组创建成功')
  async createGroup(
    @Param('projectId') projectId: string,
    @Body() dto: CreateGroupReqDto,
    @ReqUser('id') userId: string,
  ): Promise<GroupBriefDto> {
    const created = await this.groupService.createGroup(dto, projectId, userId)
    return plainToInstance(GroupBriefDto, created)
  }

  /** 获取分组树 */
  @Get(':projectId/api-groups/tree')
  @ProjectPermissions(['project:read'])
  @ResMsg('分组树获取成功')
  async getGroupTree(
    @Param('projectId') projectId: string,
    @ReqUser('id') userId: string,
  ): Promise<GroupNodeDto[]> {
    const tree = await this.groupService.getGroupTree(projectId, userId)
    return plainToInstance(GroupNodeDto, tree)
  }

  /** 获取分组树（含 API） */
  @Get(':projectId/api-groups/tree-with-apis')
  @ProjectPermissions(['api_group:read'], 'projectId')
  @ResMsg('分组树（含 API）获取成功')
  async getGroupTreeWithApis(
    @Param('projectId') projectId: string,
    @Query() query: GetGroupWithAPIReqDto,
    @ReqUser('id') userId: string,
  ): Promise<GroupNodeWithAPIDto[]> {
    const tree = await this.groupService.getGroupTreeWithApis(query, projectId, userId)
    return plainToInstance(GroupNodeWithAPIDto, tree)
  }

  /** 更新分组 */
  @Patch(':projectId/api-groups/:groupId')
  @ProjectPermissions(['api_group:write'])
  @ResMsg('分组更新成功')
  async updateGroup(
    @Param('projectId') projectId: string,
    @Param('groupId') groupId: string,
    @Body() dto: UpdateGroupReqDto,
    @ReqUser('id') userId: string,
  ): Promise<GroupBriefDto> {
    const updated = await this.groupService.updateGroup(dto, groupId, projectId, userId)
    return plainToInstance(GroupBriefDto, updated)
  }

  /** 移动分组 */
  @Post(':projectId/api-groups/:groupId/move')
  @ProjectPermissions(['api_group:write'])
  @ResMsg('分组移动成功')
  async moveGroup(
    @Param('projectId') projectId: string,
    @Param('groupId') groupId: string,
    @Body() dto: MoveGroupReqDto,
    @ReqUser('id') userId: string,
  ): Promise<GroupBriefDto> {
    const updated = await this.groupService.moveGroup(dto, groupId, projectId, userId)
    return plainToInstance(GroupBriefDto, updated)
  }

  /** 删除分组 */
  @Delete(':projectId/api-groups/:groupId')
  @ProjectPermissions(['api_group:delete'])
  @ResMsg('分组删除成功')
  async deleteGroup(
    @Param('projectId') projectId: string,
    @Param('groupId') groupId: string,
    @Query() query: DeleteGroupReqDto,
    @ReqUser('id') userId: string,
  ): Promise<void> {
    await this.groupService.deleteGroup(query, groupId, projectId, userId)
  }

  /** 批量更新分组排序 */
  @Post(':projectId/api-groups/sort')
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
