import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { ProjectPermissions, RequireProjectMember } from '@/common/decorators/permissions.decorator'
import { ReqUser } from '@/common/decorators/req-user.decorator'
import { ResMsg } from '@/common/decorators/res-msg.decorator'
import { AuthGuard } from '@/common/guards/auth.guard'
import { PermissionsGuard } from '@/common/guards/permissions.guard'
import {
  ApiVersionComparisonDto,
  ApiVersionDetailDto,
  ApiVersionsDto,
  CreateVersionReqDto,
} from './dto'
import { VersionService } from './version.service'

@Controller('api')
@UseGuards(AuthGuard, PermissionsGuard)
export class VersionController {
  constructor(private readonly versionService: VersionService) {}

  /** 获取指定 API 的版本列表 */
  @Get(':projectId/apis/:apiId/versions')
  @RequireProjectMember()
  @ProjectPermissions(['api:read'])
  @ResMsg('API 版本列表获取成功')
  async getVersionList(
    @Param('projectId') projectId: string,
    @Param('apiId') apiId: string,
    @ReqUser('id') userId: string,
  ): Promise<ApiVersionsDto> {
    const result = await this.versionService.getVersionList(apiId, projectId, userId)
    return plainToInstance(ApiVersionsDto, result)
  }

  /** 获取指定 API 某个版本详情 */
  @Get(':projectId/apis/:apiId/versions/:versionId')
  @RequireProjectMember()
  @ProjectPermissions(['api:read'])
  @ResMsg('API 版本详情获取成功')
  async getVersionDetail(
    @Param('projectId') projectId: string,
    @Param('apiId') apiId: string,
    @Param('versionId') versionId: string,
    @ReqUser('id') userId: string,
  ): Promise<ApiVersionDetailDto> {
    const result = await this.versionService.getVersionDetail(apiId, versionId, projectId, userId)
    return plainToInstance(ApiVersionDetailDto, result)
  }

  /** 创建草稿版本 */
  @Post(':projectId/apis/:apiId/versions')
  @RequireProjectMember()
  @ProjectPermissions(['api:write'])
  @ResMsg('草稿版本创建成功')
  async createDraftVersion(
    @Param('projectId') projectId: string,
    @Param('apiId') apiId: string,
    @Body() dto: CreateVersionReqDto,
    @ReqUser('id') userId: string,
  ): Promise<ApiVersionDetailDto> {
    const result = await this.versionService.createDraftVersion(dto, apiId, projectId, userId)
    return plainToInstance(ApiVersionDetailDto, result)
  }

  /** 发布版本 */
  @Post(':projectId/apis/:apiId/versions/:versionId/publish')
  @RequireProjectMember()
  @ProjectPermissions(['api:write'])
  @ResMsg('版本发布成功')
  async publishVersion(
    @Param('projectId') projectId: string,
    @Param('apiId') apiId: string,
    @Param('versionId') versionId: string,
    @ReqUser('id') userId: string,
  ): Promise<void> {
    await this.versionService.publishVersion(apiId, versionId, projectId, userId)
  }

  /** 归档指定版本 */
  @Post(':projectId/apis/:apiId/versions/:versionId/archive')
  @RequireProjectMember()
  @ProjectPermissions(['api:write'])
  @ResMsg('版本归档成功')
  async archiveVersion(
    @Param('projectId') projectId: string,
    @Param('apiId') apiId: string,
    @Param('versionId') versionId: string,
    @ReqUser('id') userId: string,
  ): Promise<void> {
    await this.versionService.archiveVersion(apiId, versionId, projectId, userId)
  }

  /** 回滚到指定历史版本 */
  @Post(':projectId/apis/:apiId/versions/:versionId/rollback')
  @RequireProjectMember()
  @ProjectPermissions(['api:write'])
  @ResMsg('版本回滚成功')
  async rollbackToVersion(
    @Param('projectId') projectId: string,
    @Param('apiId') apiId: string,
    @Param('versionId') versionId: string,
    @ReqUser('id') userId: string,
  ): Promise<void> {
    await this.versionService.rollbackToVersion(apiId, versionId, projectId, userId)
  }

  /** 比较两个版本差异 */
  @Get(':projectId/apis/:apiId/versions/compare')
  @RequireProjectMember()
  @ProjectPermissions(['api:read'])
  @ResMsg('API 版本比较成功')
  async compareVersions(
    @Param('projectId') projectId: string,
    @Param('apiId') apiId: string,
    @Query('from') fromVersionId: string,
    @Query('to') toVersionId: string,
    @ReqUser('id') userId: string,
  ): Promise<ApiVersionComparisonDto> {
    const result = await this.versionService.compareVersions(
      apiId,
      fromVersionId,
      toVersionId,
      projectId,
      userId,
    )
    return plainToInstance(ApiVersionComparisonDto, result)
  }
}
