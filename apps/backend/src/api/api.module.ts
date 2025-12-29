import { Module } from '@nestjs/common'
import { AuthModule } from '@/auth/auth.module'
import { PrismaModule } from '@/infra/prisma/prisma.module'
import { PermissionModule } from '@/permission/permission.module'
import { ProjectModule } from '@/project/project.module'
import { UtilModule } from '@/util/util.module'
import { ApiController } from './api.controller'
import { ApiService } from './api.service'
import { GroupController } from './group.controller'
import { GroupService } from './group.service'
import { ApiUtilsService } from './utils.service'
import { VersionController } from './version.controller'
import { VersionService } from './version.service'

@Module({
  imports: [PrismaModule, AuthModule, PermissionModule, ProjectModule, UtilModule],
  controllers: [ApiController, GroupController, VersionController],
  providers: [ApiService, ApiUtilsService, GroupService, VersionService],
  exports: [ApiService, ApiUtilsService, GroupService, VersionService],
})
export class ApiModule {}
