import { Module } from '@nestjs/common'
import { AuthModule } from '@/auth/auth.module'
import { PrismaModule } from '@/infra/prisma/prisma.module'
import { PermissionModule } from '@/permission/permission.module'
import { RoleModule } from '@/role/role.module'
import { UserModule } from '@/user/user.module'
import { TeamMemberController } from './team-member.controller'
import { TeamMemberService } from './team-member.service'
import { TeamController } from './team.controller'
import { TeamService } from './team.service'
import { TeamUtilsService } from './utils.service'

@Module({
  imports: [PrismaModule, AuthModule, PermissionModule, RoleModule, UserModule],
  controllers: [TeamController, TeamMemberController],
  providers: [TeamService, TeamUtilsService, TeamMemberService],
  exports: [TeamService, TeamMemberService],
})
export class TeamModule {}
