import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { ProjectPermissions, RequireProjectMember } from '@/common/decorators/permissions.decorator'
import { ReqUser } from '@/common/decorators/req-user.decorator'
import { ResMsg } from '@/common/decorators/res-msg.decorator'
import { AuthGuard } from '@/common/guards/auth.guard'
import { PermissionsGuard } from '@/common/guards/permissions.guard'
import { ApiService } from './api.service'
import {
  ApiBriefDto,
  ApiDetailDto,
  ApiOperationLogsDto,
  ApisDto,
  CloneApiReqDto,
  CreateApiReqDto,
  GetApiOperationLogsReqDto,
  GetApisReqDto,
  SortItemsReqDto,
  UpdateApiReqDto,
} from './dto'

@Controller('api')
@UseGuards(AuthGuard, PermissionsGuard)
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  /** 创建 API */
  @Post(':projectId/apis')
  @RequireProjectMember()
  @ProjectPermissions(['api:create'], 'projectId')
  @ResMsg('API 创建成功')
  async createAPI(
    @Param('projectId') projectId: string,
    @Body() dto: CreateApiReqDto,
    @ReqUser('id') userId: string,
  ): Promise<ApiBriefDto> {
    const result = await this.apiService.createAPI(dto, projectId, userId)
    return plainToInstance(ApiBriefDto, result)
  }

  /** 查询 API 列表 */
  @Get(':projectId/apis')
  @RequireProjectMember()
  @ProjectPermissions(['project:read'])
  @ResMsg('API 列表获取成功')
  async getAPIList(
    @Param('projectId') projectId: string,
    @Query() dto: GetApisReqDto,
  ): Promise<ApisDto> {
    const result = await this.apiService.getAPIList(dto, projectId)
    return plainToInstance(ApisDto, result)
  }

  /** 获取某 API 详情信息 */
  @Get(':projectId/apis/:apiId')
  @RequireProjectMember()
  @ProjectPermissions(['api:read'])
  @ResMsg('API 详情获取成功')
  async getAPIDetail(
    @Param('projectId') projectId: string,
    @Param('apiId') apiId: string,
  ): Promise<ApiDetailDto> {
    const result = await this.apiService.getAPIDetail(apiId, projectId)
    return plainToInstance(ApiDetailDto, result)
  }

  /** 获取某 API 的操作日志 */
  @Get(':projectId/apis/:apiId/logs')
  @RequireProjectMember()
  @ProjectPermissions(['api:read'])
  @ResMsg('API 操作日志获取成功')
  async getAPIOperationLogs(
    @Param('projectId') projectId: string,
    @Param('apiId') apiId: string,
    @Query() dto: GetApiOperationLogsReqDto,
    @ReqUser('id') userId: string,
  ): Promise<ApiOperationLogsDto> {
    const result = await this.apiService.getAPIOperationLogs(dto, apiId, projectId, userId)
    return plainToInstance(ApiOperationLogsDto, result)
  }

  /** 更新 API 信息 */
  @Patch(':projectId/apis/:apiId')
  @RequireProjectMember()
  @ProjectPermissions(['api:write'])
  @ResMsg('API 更新成功')
  async updateAPI(
    @Param('projectId') projectId: string,
    @Param('apiId') apiId: string,
    @Body() dto: UpdateApiReqDto,
    @ReqUser('id') userId: string,
  ): Promise<ApiBriefDto> {
    const result = await this.apiService.updateAPI(dto, apiId, projectId, userId)
    return plainToInstance(ApiBriefDto, result)
  }

  /** 删除 API */
  @Delete(':projectId/apis/:apiId')
  @RequireProjectMember()
  @ProjectPermissions(['api:delete'])
  @ResMsg('API 删除成功')
  async deleteAPI(
    @Param('projectId') projectId: string,
    @Param('apiId') apiId: string,
    @ReqUser('id') userId: string,
  ): Promise<void> {
    await this.apiService.deleteAPI(apiId, projectId, userId)
  }

  /** 复制 API */
  @Post(':projectId/apis/:apiId/clone')
  @RequireProjectMember()
  @ProjectPermissions(['api:create'], 'projectId')
  @ResMsg('API 复制成功')
  async cloneAPI(
    @Param('projectId') projectId: string,
    @Param('apiId') apiId: string,
    @Body() dto: CloneApiReqDto,
    @ReqUser('id') userId: string,
  ): Promise<ApiBriefDto> {
    const result = await this.apiService.cloneAPI(dto, apiId, projectId, userId)
    return plainToInstance(ApiBriefDto, result)
  }

  /** 批量更新 API 排序 */
  @Post(':projectId/apis/sort')
  @RequireProjectMember()
  @ProjectPermissions(['api:write'])
  @ResMsg('API 排序更新成功')
  async sortAPIs(
    @Param('projectId') projectId: string,
    @Body() dto: SortItemsReqDto,
    @ReqUser('id') userId: string,
  ): Promise<void> {
    await this.apiService.sortAPIs(dto, projectId, userId)
  }
}
