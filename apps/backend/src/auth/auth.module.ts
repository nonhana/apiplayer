import { Module } from '@nestjs/common'
import { PrismaModule } from '../common/prisma/prisma.module'
import { SessionModule } from '../session/session.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { AuthGuard } from './guards/auth.guard'

@Module({
  imports: [SessionModule, PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
