import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { ReqUser } from '@/common/decorators/req-user.decorator'
import { UserDetailInfoDto } from '@/common/dto/user.dto'
import { AuthGuard } from '@/common/guards/auth.guard'
import { SearchUsersReqDto, SearchUsersResDto } from './dto/search-users.dto'
import { UpdateUserProfileReqDto } from './dto/update-profile.dto'
import { UserService } from './user.service'

@Controller('user')
@UseGuards(AuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  /** 获取用户个人资料 */
  @Get('profile')
  async getProfile(@ReqUser('id') userId: string): Promise<UserDetailInfoDto> {
    const result = await this.userService.getUserProfile(userId)
    return plainToInstance(UserDetailInfoDto, result)
  }

  /** 更新用户个人资料 */
  @Patch('profile')
  async updateProfile(
    @ReqUser('id') userId: string,
    @Body() dto: UpdateUserProfileReqDto,
  ): Promise<UserDetailInfoDto> {
    const result = await this.userService.updateUserProfile(dto, userId)
    return plainToInstance(UserDetailInfoDto, result)
  }

  /** 分页搜索用户 */
  @Get('search')
  async searchUsers(
    @Query() dto: SearchUsersReqDto,
  ): Promise<SearchUsersResDto> {
    const result = await this.userService.searchUsers(dto)
    return plainToInstance(SearchUsersResDto, result)
  }
}
