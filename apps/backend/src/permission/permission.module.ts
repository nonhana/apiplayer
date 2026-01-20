import { forwardRef, Module } from '@nestjs/common'
import { AuthModule } from '@/auth/auth.module'
import { PermissionsGuard } from '@/common/guards/permissions.guard'
import { PrismaModule } from '@/infra/prisma/prisma.module'
import { PermissionCheckerService } from './permission-checker.service'
import { PermissionController } from './permission.controller'
import { PermissionService } from './permission.service'

@Module({
  imports: [
    forwardRef(() => AuthModule),
    PrismaModule,
  ],
  controllers: [PermissionController],
  providers: [PermissionService, PermissionCheckerService, PermissionsGuard],
  exports: [PermissionService, PermissionCheckerService, PermissionsGuard],
})
export class PermissionModule {}
