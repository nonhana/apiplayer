import { Controller, Get, UseGuards } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { ReqUser } from '@/common/decorators/req-user.decorator'
import { UserFullInfoDto } from '@/common/dto/user.dto'
import { AuthGuard } from '@/common/guards/auth.guard'
import { UserService } from './user.service'

@Controller('user')
@UseGuards(AuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  /** 获取用户个人资料 */
  @Get('profile')
  async getProfile(@ReqUser('id') userId: string): Promise<UserFullInfoDto> {
    const result = await this.userService.getUserProfile(userId)
    return plainToInstance(UserFullInfoDto, result)
  }
}
