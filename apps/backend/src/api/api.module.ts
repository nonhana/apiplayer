import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { AuthModule } from '@/auth/auth.module'
import { PrismaModule } from '@/infra/prisma/prisma.module'
import { SystemConfigModule } from '@/infra/system-config/system-config.module'
import { PermissionModule } from '@/permission/permission.module'
import { ProjectModule } from '@/project/project.module'
import { UtilModule } from '@/util/util.module'
import { ApiController } from './api.controller'
import { ApiService } from './api.service'
import { GroupController } from './group.controller'
import { GroupService } from './group.service'
import { ImportController } from './import.controller'
import { ImportService } from './import.service'
import { ApiUtilsService } from './utils.service'
import { VersionController } from './version.controller'
import { VersionService } from './version.service'

@Module({
  imports: [PrismaModule, AuthModule, PermissionModule, ProjectModule, UtilModule, SystemConfigModule, HttpModule],
  controllers: [ApiController, GroupController, VersionController, ImportController],
  providers: [ApiService, ApiUtilsService, GroupService, VersionService, ImportService],
  exports: [ApiService, ApiUtilsService, GroupService, VersionService, ImportService],
})
export class ApiModule {}
