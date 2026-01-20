import { Module } from '@nestjs/common'
import { UtilModule } from '@/util/util.module'
import { EmailCodeController } from './email-code.controller'
import { EmailCodeService } from './email-code.service'

@Module({
  imports: [UtilModule],
  controllers: [EmailCodeController],
  providers: [EmailCodeService],
  exports: [EmailCodeService],
})
export class EmailCodeModule {}
