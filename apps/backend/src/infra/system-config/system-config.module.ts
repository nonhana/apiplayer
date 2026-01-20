import { forwardRef, Global, Module } from '@nestjs/common'
import { AuthModule } from '@/auth/auth.module'
import { PermissionModule } from '@/permission/permission.module'
import { SystemConfigController } from './system-config.controller'
import { SystemConfigService } from './system-config.service'

@Global()
@Module({
  imports: [
    forwardRef(() => AuthModule),
    PermissionModule,
  ],
  controllers: [SystemConfigController],
  providers: [SystemConfigService],
  exports: [SystemConfigService],
})
export class SystemConfigModule {}
