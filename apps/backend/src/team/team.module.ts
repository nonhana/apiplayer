import { Module } from '@nestjs/common'
import { AuthModule } from '@/auth/auth.module'
import { PrismaModule } from '@/infra/prisma/prisma.module'
import { PermissionModule } from '@/permission/permission.module'
import { RoleModule } from '@/role/role.module'
import { TeamController } from './team.controller'
import { TeamService } from './team.service'
import { TeamUtilsService } from './utils.service'

@Module({
  imports: [PrismaModule, AuthModule, PermissionModule, RoleModule],
  controllers: [TeamController],
  providers: [TeamService, TeamUtilsService],
  exports: [TeamService],
})
export class TeamModule {}
