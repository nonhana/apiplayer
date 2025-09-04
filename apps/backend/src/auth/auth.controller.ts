import { Body, Controller, Delete, Get, Param, Post, Req, Res, UseGuards } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { FastifyReply, FastifyRequest } from 'fastify'
import { Public } from '@/common/decorators/public.decorator'
import { MessageResDto } from '@/common/dto/message.dto'
import { UserBriefInfoDto, UserDetailInfoDto } from '@/common/dto/user.dto'
import { AuthGuard } from '@/common/guards/auth.guard'
import { PasswordConfirmationPipe } from '@/common/pipes/password-confirmation.pipe'
import { CookieService } from '@/cookie/cookie.service'
import { AuthService } from './auth.service'
import { ActiveSessionsResDto } from './dto/active-sessions.dto'
import { CheckAuthStatusResDto } from './dto/check-auth.dto'
import { CheckAvailabilityReqDto, CheckAvailabilityResDto } from './dto/check-availability.dto'
import { LoginReqDto, LoginResDto } from './dto/login.dto'
import { LogoutAllResDto } from './dto/logout-all.dto'
import { RegisterReqDto, RegisterResDto } from './dto/register.dto'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cookieService: CookieService,
  ) {}

  /** 用户登录 */
  @Public()
  @Post('login')
  async login(
    @Body() loginDto: LoginReqDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) response: FastifyReply,
  ): Promise<LoginResDto> {
    // 提取客户端信息
    const userAgent = request.headers['user-agent']
    const ipAddress = request.headers['x-forwarded-for'] as string
      || request.headers['x-real-ip'] as string
      || request.ip

    const { user, sessionId } = await this.authService.login(loginDto, {
      userAgent,
      ipAddress,
    })

    // 成功登录后立即重新生成 Session ID（防御会话固定攻击）
    const newSessionId = await this.authService.regenerateSessionId(sessionId)
    const finalSessionId = newSessionId || sessionId

    // 设置安全的 Cookie
    this.cookieService.setSecureSessionCookie(response, finalSessionId)

    return {
      message: '登录成功',
      user: plainToInstance(UserBriefInfoDto, user),
      token: finalSessionId,
    }
  }

  /** 用户注册 */
  @Public()
  @Post('register')
  async register(@Body(PasswordConfirmationPipe) registerDto: RegisterReqDto): Promise<RegisterResDto> {
    const { user, message } = await this.authService.register(registerDto)
    return {
      message,
      user: plainToInstance(UserBriefInfoDto, user),
    }
  }

  /** 检查邮箱或用户名可用性 */
  @Public()
  @Post('check-availability')
  async checkAvailability(
    @Body() checkDto: CheckAvailabilityReqDto,
  ): Promise<CheckAvailabilityResDto> {
    return await this.authService.checkAvailability(checkDto)
  }

  /** 用户登出 */
  @UseGuards(AuthGuard)
  @Post('logout')
  async logout(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) response: FastifyReply,
  ): Promise<MessageResDto> {
    const sessionId = request.sessionId

    if (sessionId)
      await this.authService.logout(sessionId)

    // 清除 Cookie
    this.cookieService.clearSessionCookie(response)

    return { message: '登出成功' }
  }

  /** 登出所有设备 */
  @UseGuards(AuthGuard)
  @Post('logout-all')
  async logoutAllDevices(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) response: FastifyReply,
  ): Promise<LogoutAllResDto> {
    const user = request.user!

    const destroyedCount = await this.authService.logoutAllDevices(user.id)

    // 清除当前 Cookie
    this.cookieService.clearSessionCookie(response)

    return {
      message: `已登出所有设备`,
      destroyedSessions: destroyedCount,
    }
  }

  /** 获取当前用户信息 */
  @UseGuards(AuthGuard)
  @Get('me')
  async getCurrentUser(@Req() request: FastifyRequest): Promise<UserDetailInfoDto> {
    return request.user!
  }

  /** 获取当前用户的活跃会话列表 */
  @UseGuards(AuthGuard)
  @Get('sessions')
  async getActiveSessions(@Req() request: FastifyRequest): Promise<ActiveSessionsResDto> {
    const user = request.user!
    const currentSessionId = request.sessionId

    const sessions = await this.authService.getUserActiveSessions(user.id, currentSessionId)

    return {
      sessions,
      total: sessions.length,
    }
  }

  /** 销毁指定会话 */
  @UseGuards(AuthGuard)
  @Delete('sessions/:sessionId')
  async destroySession(
    @Param('sessionId') sessionId: string,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) response: FastifyReply,
  ): Promise<MessageResDto> {
    const user = request.user!
    const currentSessionId = request.sessionId

    await this.authService.destroySpecificSession(user.id, sessionId)

    // 如果销毁的是当前会话，需要清除 Cookie
    if (sessionId === currentSessionId) {
      this.cookieService.clearSessionCookie(response)
    }

    return { message: '会话已销毁' }
  }

  /** 检查登录状态（用于前端轮询检查） */
  @UseGuards(AuthGuard)
  @Get('check')
  async checkAuthStatus(): Promise<CheckAuthStatusResDto> {
    return {
      isAuthenticated: true,
      message: '用户已登录',
    }
  }
}
