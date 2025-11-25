import { ClassSerializerInterceptor, Module, ValidationPipe } from '@nestjs/common'
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { ApiModule } from './api/api.module'
import { AppController } from './app.controller'
import { AuthModule } from './auth/auth.module'
import { AllExceptionFilter } from './common/filters/all-exception.filter'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'
import { WinstonLogger } from './common/logger/winston-logger.service'
import { CookieModule } from './cookie/cookie.module'
import { EnvConfigModule } from './infra/env-config/env-config.module'
import { PrismaModule } from './infra/prisma/prisma.module'
import { RedisModule } from './infra/redis/redis.module'
import { PermissionModule } from './permission/permission.module'
import { ProjectModule } from './project/project.module'
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
    ProjectModule,
    CookieModule,
    ApiModule,
  ],
  controllers: [AppController],
  providers: [
    WinstonLogger,
    {
      provide: APP_FILTER,
      useClass: AllExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
          transformOptions: {
            enableImplicitConversion: true,
          },
        }),
    },
  ],
})
export class AppModule {}
