import { Module } from '@nestjs/common'
import { AuthModule } from '@/auth/auth.module'
import { PrismaModule } from '@/infra/prisma/prisma.module'
import { PermissionModule } from '@/permission/permission.module'
import { RoleModule } from '@/role/role.module'
import { UserModule } from '@/user/user.module'
import { UtilModule } from '@/util/util.module'
import { InvitationController, TeamInvitationController } from './team-invitation.controller'
import { TeamInvitationService } from './team-invitation.service'
import { TeamMemberController } from './team-member.controller'
import { TeamMemberService } from './team-member.service'
import { TeamController } from './team.controller'
import { TeamService } from './team.service'
import { TeamUtilsService } from './utils.service'

@Module({
  imports: [PrismaModule, AuthModule, PermissionModule, RoleModule, UserModule, UtilModule],
  controllers: [TeamController, TeamMemberController, TeamInvitationController, InvitationController],
  providers: [TeamService, TeamUtilsService, TeamMemberService, TeamInvitationService],
  exports: [TeamService, TeamMemberService, TeamInvitationService],
})
export class TeamModule {}
