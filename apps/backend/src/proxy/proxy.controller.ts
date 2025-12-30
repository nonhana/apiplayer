import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { ResMsg } from '@/common/decorators/res-msg.decorator'
import { AuthGuard } from '@/common/guards/auth.guard'
import { ProxyRequestDto, ProxyResponseDto } from './dto'
import { ProxyService } from './proxy.service'

@Controller('proxy')
@UseGuards(AuthGuard)
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  /** 代理转发请求 */
  @Post('request')
  @ResMsg('请求发送成功')
  async proxyRequest(@Body() dto: ProxyRequestDto): Promise<ProxyResponseDto> {
    return this.proxyService.forward(dto)
  }
}
