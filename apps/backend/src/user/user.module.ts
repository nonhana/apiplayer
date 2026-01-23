import { Module } from '@nestjs/common'
import { AuthModule } from '@/auth/auth.module'
import { EmailCodeModule } from '@/email-code/email-code.module'
import { PrismaModule } from '@/infra/prisma/prisma.module'
import { UserController } from './user.controller'
import { UserService } from './user.service'

@Module({
  imports: [PrismaModule, AuthModule, EmailCodeModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
