import { Module } from '@nestjs/common'
import { AuthModule } from '@/auth/auth.module'
import { PrismaModule } from '@/infra/prisma/prisma.module'
import { PermissionModule } from '@/permission/permission.module'
import { ProjectEnvController } from './project-env.controller'
import { ProjectEnvService } from './project-env.service'
import { ProjectGlobalParamController } from './project-global-param.controller'
import { ProjectGlobalParamService } from './project-global-param.service'
import { ProjectMemberController } from './project-member.controller'
import { ProjectMemberService } from './project-member.service'
import { ProjectController } from './project.controller'
import { ProjectService } from './project.service'
import { ProjectUtilsService } from './utils.service'

@Module({
  imports: [PrismaModule, AuthModule, PermissionModule],
  controllers: [
    ProjectController,
    ProjectMemberController,
    ProjectEnvController,
    ProjectGlobalParamController,
  ],
  providers: [
    ProjectService,
    ProjectMemberService,
    ProjectEnvService,
    ProjectGlobalParamService,
    ProjectUtilsService,
  ],
  exports: [
    ProjectService,
    ProjectMemberService,
    ProjectEnvService,
    ProjectGlobalParamService,
  ],
})
export class ProjectModule {}
