import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { ResMsg } from '@/common/decorators/res-msg.decorator'
import { SystemConfigItemDto } from './dto'
import { UpdateConfigReqDto, UpdateConfigsReqDto } from './dto/update-config.dto'
import { SystemConfigService } from './system-config.service'
import { SystemConfigKey } from './system-config.types'

@Controller('system-config')
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  /** 获取全部系统配置列表 */
  @Get()
  getAllSystemConfigs(): SystemConfigItemDto[] {
    const result = this.systemConfigService.getAllWithMetadata()
    return plainToInstance(SystemConfigItemDto, result)
  }

  /** 批量更新系统配置值 */
  @Post()
  @ResMsg('系统配置批量更新成功')
  async updateSystemConfigByMany(@Body() dto: UpdateConfigsReqDto): Promise<void> {
    await this.systemConfigService.setMany(dto)
  }

  /** 获取指定 key 的系统配置值 */
  @Get(':key')
  getSystemConfigByKey(@Param('key') key: SystemConfigKey) {
    return this.systemConfigService.get(key)
  }

  /** 更新指定 key 的系统配置值 */
  @Post(':key')
  @ResMsg('系统配置更新成功')
  async updateSystemConfigByKey(
    @Param('key') key: SystemConfigKey,
    @Body() dto: UpdateConfigReqDto,
  ): Promise<void> {
    await this.systemConfigService.set(key, dto.value)
  }
}
