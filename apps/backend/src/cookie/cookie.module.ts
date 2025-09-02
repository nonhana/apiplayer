import { Module } from '@nestjs/common'
import { CookieService } from './cookie.service'

@Module({
  providers: [CookieService],
})
export class CookieModule {}
