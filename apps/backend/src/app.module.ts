import { Module } from '@nestjs/common'
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core'
import { AppController } from './app.controller'
import { AuthModule } from './auth/auth.module'
import { AllExceptionFilter } from './common/filters/all-exception.filter'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'
import { EnvConfigModule } from './infra/env-config/env-config.module'
import { PrismaModule } from './infra/prisma/prisma.module'
import { RedisModule } from './infra/redis/redis.module'
import { PermissionModule } from './permission/permission.module'
import { RoleModule } from './role/role.module'
import { TeamModule } from './team/team.module'
import { UserModule } from './user/user.module'

@Module({
  imports: [
    // Infrastructure
    EnvConfigModule,
    PrismaModule,
    RedisModule,

    // Business
    TeamModule,
    AuthModule,
    UserModule,
    RoleModule,
    PermissionModule,
  ],
  controllers: [AppController],
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
