import { Controller, Get, Req, UseGuards } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { FastifyRequest } from 'fastify'
import { UserFullInfoDto } from '@/common/dto/user.dto'
import { AuthGuard } from '@/common/guards/auth.guard'
import { UserService } from './user.service'

@Controller('user')
@UseGuards(AuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  /** 获取用户个人资料 */
  @Get('profile')
  async getProfile(@Req() request: FastifyRequest): Promise<UserFullInfoDto> {
    const user = request.user!
    const result = await this.userService.getUserProfile(user.id)
    return plainToInstance(UserFullInfoDto, result)
  }
}
