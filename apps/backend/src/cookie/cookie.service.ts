import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { FastifyReply } from 'fastify'

@Injectable()
export class CookieService {
  private isProduction: boolean

  constructor(private readonly configService: ConfigService) {
    this.isProduction = this.configService.get('NODE_ENV') === 'production'
  }

  /** 设置安全的 Session Cookie */
  setSecureSessionCookie(response: FastifyReply, sessionId: string): void {
    response.cookie('sid', sessionId, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'lax',
      path: '/',
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
    })
  }
}
