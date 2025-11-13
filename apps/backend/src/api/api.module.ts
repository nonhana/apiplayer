import { Module } from '@nestjs/common'
import { AuthModule } from '@/auth/auth.module'
import { PrismaModule } from '@/infra/prisma/prisma.module'
import { PermissionModule } from '@/permission/permission.module'
import { ProjectModule } from '@/project/project.module'
import { ApiController } from './api.controller'
import { ApiService } from './api.service'
import { ApiUtilsService } from './utils.service'

@Module({
  imports: [PrismaModule, AuthModule, PermissionModule, ProjectModule],
  controllers: [ApiController],
  providers: [ApiService, ApiUtilsService],
  exports: [ApiService],
})
export class ApiModule {}
