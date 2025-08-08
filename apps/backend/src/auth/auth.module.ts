import { Module } from '@nestjs/common'
import { AuthGuard } from '@/common/guards/auth.guard'
import { PrismaModule } from '@/infra/prisma/prisma.module'
import { SessionModule } from '@/session/session.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'

@Module({
  imports: [SessionModule, PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
