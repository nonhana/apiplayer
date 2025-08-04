import { Module } from '@nestjs/common'
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core'
import { AuthModule } from './auth/auth.module'
import { AllExceptionFilter } from './common/filters/all-exception.filter'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'
import { PrismaModule } from './common/prisma/prisma.module'
import { EnvConfigModule } from './env-config/env-config.module'
import { RedisModule } from './redis/redis.module'
import { UserModule } from './user/user.module'

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UserModule,
    RedisModule,
    EnvConfigModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
