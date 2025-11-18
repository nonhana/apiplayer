import { Controller, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@/common/guards/auth.guard'
import { PermissionsGuard } from '@/common/guards/permissions.guard'

@Controller('api')
@UseGuards(AuthGuard, PermissionsGuard)
export class VersionController {}
