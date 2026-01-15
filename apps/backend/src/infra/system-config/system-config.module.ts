import { Global, Module } from '@nestjs/common'
import { SystemConfigController } from './system-config.controller'
import { SystemConfigService } from './system-config.service'

@Global()
@Module({
  controllers: [SystemConfigController],
  providers: [SystemConfigService],
  exports: [SystemConfigService],
})
export class SystemConfigModule {}
