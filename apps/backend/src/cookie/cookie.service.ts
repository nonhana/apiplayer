import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { FastifyReply } from 'fastify'

/** Cookie 配置选项 */
export interface CookieOptions {
  /** Cookie 过期时间（秒） */
  maxAge?: number
}

@Injectable()
export class CookieService {
  private isProduction: boolean
  private cookieDomain: string | undefined
  private cookieMaxAge: number

  constructor(private readonly configService: ConfigService) {
    this.isProduction = this.configService.get('NODE_ENV') === 'production'
    this.cookieDomain = this.configService.get<string>('COOKIE_DOMAIN') || undefined
    this.cookieMaxAge = this.configService.get<number>('COOKIE_MAX_AGE') || 7 * 24 * 60 * 60
  }

  /** 设置安全的 Session Cookie */
  setSecureSessionCookie(
    response: FastifyReply,
    sessionId: string,
    options: CookieOptions = {},
  ): void {
    const maxAge = options.maxAge ?? this.cookieMaxAge

    response.cookie('sid', sessionId, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: maxAge * 1000,
      ...(this.cookieDomain && { domain: this.cookieDomain }),
    })
  }

  /** 续期 Session Cookie（无感刷新） */
  renewSessionCookie(
    response: FastifyReply,
    sessionId: string,
    ttlSeconds?: number,
  ): void {
    const maxAge = ttlSeconds ?? this.cookieMaxAge

    response.cookie('sid', sessionId, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: maxAge * 1000,
      ...(this.cookieDomain && { domain: this.cookieDomain }),
    })
  }

  /** 清除 Session Cookie */
  clearSessionCookie(response: FastifyReply): void {
    response.cookie('sid', '', {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'lax',
      path: '/',
      expires: new Date(0),
      ...(this.cookieDomain && { domain: this.cookieDomain }),
    })
  }
}
