import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { RequireSystemAdmin } from '@/common/decorators/permissions.decorator'
import { Public } from '@/common/decorators/public.decorator'
import { ResMsg } from '@/common/decorators/res-msg.decorator'
import { AuthGuard } from '@/common/guards/auth.guard'
import { PermissionsGuard } from '@/common/guards/permissions.guard'
import { SystemConfigItemDto, UpdateConfigReqDto, UpdateConfigsReqDto } from './dto'
import { SystemConfigService } from './system-config.service'
import { SystemConfigKey } from './system-config.types'

@Controller('system-config')
@UseGuards(AuthGuard, PermissionsGuard)
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  /** 获取全部系统配置列表 */
  @Get()
  @Public()
  getAllSystemConfigs(): SystemConfigItemDto[] {
    const result = this.systemConfigService.getAllWithMetadata()
    return plainToInstance(SystemConfigItemDto, result)
  }

  /** 批量更新系统配置值 */
  @Patch()
  @RequireSystemAdmin()
  @ResMsg('系统配置批量更新成功')
  async updateSystemConfigByMany(@Body() dto: UpdateConfigsReqDto): Promise<void> {
    await this.systemConfigService.setMany(dto)
  }

  /** 获取指定 key 的系统配置值 */
  @Get(':key')
  @Public()
  async getSystemConfigByKey(@Param('key') key: SystemConfigKey): Promise<unknown> {
    return this.systemConfigService.get(key)
  }

  /** 更新指定 key 的系统配置值 */
  @Patch(':key')
  @RequireSystemAdmin()
  @ResMsg('系统配置更新成功')
  async updateSystemConfigByKey(
    @Param('key') key: SystemConfigKey,
    @Body() dto: UpdateConfigReqDto,
  ): Promise<void> {
    await this.systemConfigService.set(key, dto.value)
  }
}
