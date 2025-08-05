import { Controller, Get, Inject, Req, UseGuards } from '@nestjs/common'
import { FastifyRequest } from 'fastify'
import { AuthGuard } from '@/common/guards/auth.guard'
import { UserService } from './user.service'

@Controller('user')
@UseGuards(AuthGuard)
export class UserController {
  @Inject(UserService)
  private readonly userService: UserService

  /** 获取用户个人资料 */
  @Get('profile')
  async getProfile(@Req() request: FastifyRequest) {
    const user = request.user!
    return await this.userService.getUserProfile(user.id)
  }

  /** 获取用户设置 */
  @Get('settings')
  async getSettings(@Req() request: FastifyRequest) {
    const user = request.user!
    return await this.userService.getUserSettings(user.id)
  }
}
