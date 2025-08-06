import { Module } from '@nestjs/common'
import { AuthModule } from '@/auth/auth.module'
import { PrismaModule } from '@/infra/prisma/prisma.module'
import { ProjectEnvironmentController } from './project-environment.controller'
import { ProjectEnvironmentService } from './project-environment.service'
import { ProjectGlobalParamController } from './project-global-param.controller'
import { ProjectGlobalParamService } from './project-global-param.service'
import { ProjectMemberController } from './project-member.controller'
import { ProjectMemberService } from './project-member.service'
import { ProjectController } from './project.controller'
import { ProjectService } from './project.service'

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [
    ProjectController,
    ProjectMemberController,
    ProjectEnvironmentController,
    ProjectGlobalParamController,
  ],
  providers: [
    ProjectService,
    ProjectMemberService,
    ProjectEnvironmentService,
    ProjectGlobalParamService,
  ],
  exports: [
    ProjectService,
    ProjectMemberService,
    ProjectEnvironmentService,
    ProjectGlobalParamService,
  ],
})
export class ProjectModule {}
