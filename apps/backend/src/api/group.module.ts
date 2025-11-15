import { Module } from '@nestjs/common'
import { AuthModule } from '@/auth/auth.module'
import { PrismaModule } from '@/infra/prisma/prisma.module'
import { PermissionModule } from '@/permission/permission.module'
import { ProjectModule } from '@/project/project.module'
import { GroupController } from './group.controller'
import { GroupService } from './group.service'

@Module({
  imports: [PrismaModule, AuthModule, PermissionModule, ProjectModule],
  controllers: [GroupController],
  providers: [GroupService],
})
export class GroupModule {}
