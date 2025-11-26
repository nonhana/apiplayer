import { Module } from '@nestjs/common'
import { AuthModule } from '@/auth/auth.module'
import { LocalUploadService } from '@/infra/upload/local-upload.service'
import { UtilController } from './util.controller'
import { UtilService } from './util.service'

@Module({
  imports: [AuthModule],
  controllers: [UtilController],
  providers: [UtilService, LocalUploadService],
  exports: [UtilService],
})
export class UtilModule {}
