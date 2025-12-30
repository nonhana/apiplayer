import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { AuthModule } from '@/auth/auth.module'
import { ProxyController } from './proxy.controller'
import { ProxyService } from './proxy.service'
import { ProxyUtilsService } from './utils.service'

@Module({
  imports: [
    AuthModule,
    HttpModule.register({
      timeout: 30000, // 默认超时 30s
      maxRedirects: 5, // 最大重定向次数 5 次
    }),
  ],
  controllers: [ProxyController],
  providers: [ProxyService, ProxyUtilsService],
  exports: [ProxyService],
})
export class ProxyModule {}
