import { Body, Controller, Delete, Get, Inject, Param, Post, Req, Res, UseGuards } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { FastifyReply, FastifyRequest } from 'fastify'
import { Public } from '../common/decorators/public.decorator'
import { AuthGuard } from '../common/guards/auth.guard'
import { PasswordConfirmationPipe } from '../common/pipes/password-confirmation.pipe'
import { AuthService } from './auth.service'
import {
  LoginDto,
  LoginResponseDto,
} from './dto/login.dto'
import { RegisterDto, RegisterResponseDto } from './dto/register.dto'
import { ActiveSessionsResponseDto, CheckAvailabilityDto, CheckAvailabilityResponseDto, CurrentUserResponseDto, LogoutResponseDto } from './dto/utils.dto'

@Controller('auth')
export class AuthController {
  @Inject(AuthService)
  private readonly authService: AuthService

  @Inject(ConfigService)
  private readonly configService: ConfigService

  /** 用户登录 */
  @Public()
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) response: FastifyReply,
  ): Promise<LoginResponseDto> {
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
    this.setSecureSessionCookie(response, finalSessionId)

    return {
      message: '登录成功',
      user,
    }
  }

  /** 用户注册 */
  @Public()
  @Post('register')
  async register(@Body(PasswordConfirmationPipe) registerDto: RegisterDto): Promise<RegisterResponseDto> {
    const result = await this.authService.register(registerDto)

    return result
  }

  /** 检查邮箱或用户名可用性 */
  @Public()
  @Post('check-availability')
  async checkAvailability(
    @Body() checkDto: CheckAvailabilityDto,
  ): Promise<CheckAvailabilityResponseDto> {
    return await this.authService.checkAvailability(checkDto)
  }

  /** 用户登出 */
  @UseGuards(AuthGuard)
  @Post('logout')
  async logout(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) response: FastifyReply,
  ): Promise<LogoutResponseDto> {
    const sessionId = request.sessionId

    if (sessionId) {
      await this.authService.logout(sessionId)
    }

    // 清除 Cookie
    this.clearSessionCookie(response)

    return {
      message: '登出成功',
    }
  }

  /** 登出所有设备 */
  @UseGuards(AuthGuard)
  @Post('logout-all')
  async logoutAllDevices(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) response: FastifyReply,
  ): Promise<{ message: string, destroyedSessions: number }> {
    const user = request.user!

    const destroyedCount = await this.authService.logoutAllDevices(user.id)

    // 清除当前 Cookie
    this.clearSessionCookie(response)

    return {
      message: `已登出所有设备`,
      destroyedSessions: destroyedCount,
    }
  }

  /** 获取当前用户信息 */
  @UseGuards(AuthGuard)
  @Get('me')
  async getCurrentUser(@Req() request: FastifyRequest): Promise<CurrentUserResponseDto> {
    return request.user!
  }

  /** 获取当前用户的活跃会话列表 */
  @UseGuards(AuthGuard)
  @Get('sessions')
  async getActiveSessions(@Req() request: FastifyRequest): Promise<ActiveSessionsResponseDto> {
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
  ): Promise<{ message: string }> {
    const user = request.user!
    const currentSessionId = request.sessionId

    await this.authService.destroySpecificSession(user.id, sessionId)

    // 如果销毁的是当前会话，需要清除 Cookie
    if (sessionId === currentSessionId) {
      this.clearSessionCookie(response)
    }

    return {
      message: '会话已销毁',
    }
  }

  /** 检查登录状态（用于前端轮询检查） */
  @UseGuards(AuthGuard)
  @Get('check')
  async checkAuthStatus(): Promise<{ isAuthenticated: boolean, message: string }> {
    return {
      isAuthenticated: true,
      message: '用户已登录',
    }
  }

  /** 设置安全的 Session Cookie */
  private setSecureSessionCookie(response: FastifyReply, sessionId: string): void {
    const isProduction = this.configService.get('NODE_ENV') === 'production'

    // 使用 Fastify 的 cookie 方法
    response.cookie('sid', sessionId, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
    })
  }

  /** 清除 Session Cookie */
  private clearSessionCookie(response: FastifyReply): void {
    response.cookie('sid', '', {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/',
      expires: new Date(0),
    })
  }
}
