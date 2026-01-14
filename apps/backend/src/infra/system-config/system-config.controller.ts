import { Controller, Get } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { SystemConfigItemDto } from './dto'
import { SystemConfigService } from './system-config.service'

@Controller('system-config')
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  /** 获取系统配置 */
  @Get()
  getSystemConfig(): SystemConfigItemDto[] {
    const result = this.systemConfigService.getAllWithMetadata()
    return plainToInstance(SystemConfigItemDto, result)
  }
}
