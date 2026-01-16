import type { User } from 'prisma/generated/client'
import { Body, Controller, Delete, Get, Param, Post, Req, Res, UseGuards } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { FastifyReply, FastifyRequest } from 'fastify'
import { Public } from '@/common/decorators/public.decorator'
import { ReqUser } from '@/common/decorators/req-user.decorator'
import { ResMsg } from '@/common/decorators/res-msg.decorator'
import { UserDetailInfoDto, UserSessionDto } from '@/common/dto/user.dto'
import { AuthGuard } from '@/common/guards/auth.guard'
import { PasswordConfirmationPipe } from '@/common/pipes/password-confirmation.pipe'
import { REMEMBER_ME_COOKIE_MAX_AGE } from '@/constants/cookie'
import { CookieService } from '@/cookie/cookie.service'
import { AuthService } from './auth.service'
import {
  CheckAuthStatusResDto,
  CheckAvailabilityReqDto,
  CheckAvailabilityResDto,
  LoginReqDto,
  LoginResDto,
  LogoutAllResDto,
  RegisterReqDto,
} from './dto'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cookieService: CookieService,
  ) {}

  /** 用户登录 */
  @Public()
  @Post('login')
  @ResMsg('登录成功')
  async login(
    @Body() loginDto: LoginReqDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) response: FastifyReply,
  ): Promise<LoginResDto> {
    const userAgent = request.headers['user-agent']
    const ip = request.ip

    const { user, sessionId, idleTimeout } = await this.authService.login(loginDto, { userAgent, ip })

    // 成功登录后立即重新生成 Session ID
    const newSessionId = await this.authService.regenerateSessionId(sessionId)
    const finalSessionId = newSessionId || sessionId

    // 设置 Cookie，过期时间与 Session 一致
    const cookieMaxAge = loginDto.rememberMe ? REMEMBER_ME_COOKIE_MAX_AGE : idleTimeout
    this.cookieService.setSecureSessionCookie(response, finalSessionId, { maxAge: cookieMaxAge })

    return plainToInstance(LoginResDto, { user, token: finalSessionId })
  }

  /** 用户注册 */
  @Public()
  @Post('register')
  @ResMsg('注册成功')
  async register(@Body(PasswordConfirmationPipe) registerDto: RegisterReqDto): Promise<UserDetailInfoDto> {
    const newUser = await this.authService.register(registerDto)
    return plainToInstance(UserDetailInfoDto, newUser)
  }

  /** 检查邮箱或用户名可用性 */
  @Public()
  @Post('check-availability')
  @ResMsg('检查成功')
  async checkAvailability(
    @Body() checkDto: CheckAvailabilityReqDto,
  ): Promise<CheckAvailabilityResDto> {
    return await this.authService.checkAvailability(checkDto)
  }

  /** 用户登出 */
  @UseGuards(AuthGuard)
  @Post('logout')
  @ResMsg('登出成功')
  async logout(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) response: FastifyReply,
  ): Promise<void> {
    const sessionId = request.sessionId

    if (sessionId)
      await this.authService.logout(sessionId)

    // 清除 Cookie
    this.cookieService.clearSessionCookie(response)
  }

  /** 登出所有设备 */
  @UseGuards(AuthGuard)
  @Post('logout-all')
  @ResMsg('已登出所有设备')
  async logoutAllDevices(
    @ReqUser('id') userId: string,
    @Res({ passthrough: true }) response: FastifyReply,
  ): Promise<LogoutAllResDto> {
    const destroyedCount = await this.authService.logoutAllDevices(userId)

    // 清除当前 Cookie
    this.cookieService.clearSessionCookie(response)

    return {
      destroyedSessions: destroyedCount,
    }
  }

  /** 获取登录用户信息 */
  @UseGuards(AuthGuard)
  @Get('me')
  async getCurrentUser(@ReqUser() user: User): Promise<UserDetailInfoDto> {
    return plainToInstance(UserDetailInfoDto, user)
  }

  /** 获取登录用户的 Session 列表 */
  @UseGuards(AuthGuard)
  @Get('sessions')
  async getActiveSessions(
    @ReqUser('id') userId: string,
    @Req() request: FastifyRequest,
  ): Promise<UserSessionDto[]> {
    const currentSessionId = request.sessionId
    return await this.authService.getUserActiveSessions(userId, currentSessionId)
  }

  /** 销毁指定 Session */
  @UseGuards(AuthGuard)
  @Delete('sessions/:sessionId')
  @ResMsg('Session已销毁')
  async destroySession(
    @Param('sessionId') sessionId: string,
    @ReqUser('id') userId: string,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) response: FastifyReply,
  ): Promise<void> {
    const currentSessionId = request.sessionId

    await this.authService.destroySpecificSession(userId, sessionId)

    // 如果销毁的是当前Session，需要清除 Cookie
    if (sessionId === currentSessionId) {
      this.cookieService.clearSessionCookie(response)
    }
  }

  /** 检查登录状态 */
  @UseGuards(AuthGuard)
  @Get('check')
  @ResMsg('用户已登录')
  async checkAuthStatus(): Promise<CheckAuthStatusResDto> {
    return {
      isAuthenticated: true,
    }
  }
}
