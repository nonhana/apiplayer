import { Module } from '@nestjs/common'
import { AuthModule } from '@/auth/auth.module'
import { PrismaModule } from '@/infra/prisma/prisma.module'
import { PermissionModule } from '@/permission/permission.module'
import { ProjectModule } from '@/project/project.module'
import { VersionController } from './version.controller'
import { VersionService } from './version.service'

@Module({
  imports: [PrismaModule, AuthModule, PermissionModule, ProjectModule],
  controllers: [VersionController],
  providers: [VersionService],
  exports: [VersionService],
})
export class VersionModule {}
