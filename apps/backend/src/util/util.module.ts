import { Module } from '@nestjs/common'
import { AuthModule } from '@/auth/auth.module'
import { ResendMailService } from '@/infra/email/resend-mail.service'
import { LocalUploadService } from '@/infra/upload/local-upload.service'
import { R2Service } from '@/infra/upload/r2.service'
import { UtilController } from './util.controller'
import { UtilService } from './util.service'

@Module({
  imports: [AuthModule],
  controllers: [UtilController],
  providers: [UtilService, LocalUploadService, ResendMailService, R2Service],
  exports: [UtilService],
})
export class UtilModule {}
