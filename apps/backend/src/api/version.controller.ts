import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { ProjectPermissions } from '@/common/decorators/permissions.decorator'
import { ReqUser } from '@/common/decorators/req-user.decorator'
import { ResMsg } from '@/common/decorators/res-msg.decorator'
import { AuthGuard } from '@/common/guards/auth.guard'
import { PermissionsGuard } from '@/common/guards/permissions.guard'
import { ApiVersionDetailDto, ApiVersionsDto } from './dto/version.dto'
import { VersionService } from './version.service'

@Controller('api')
@UseGuards(AuthGuard, PermissionsGuard)
export class VersionController {
  constructor(private readonly versionService: VersionService) {}

  /** 获取指定 API 的版本列表 */
  @Get(':projectId/apis/:apiId/versions')
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
}
