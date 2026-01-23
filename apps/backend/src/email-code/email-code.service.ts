import { randomInt } from 'node:crypto'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { Redis } from 'ioredis'
import { HanaException } from '@/common/exceptions/hana.exception'
import { REDIS_CLIENT } from '@/infra/redis/redis.module'
import { UtilService } from '@/util/util.service'

@Injectable()
export class EmailCodeService {
  private readonly logger = new Logger(EmailCodeService.name)
  private readonly verificationCodeTTL = 5 * 60 // 5 分钟，单位：秒

  constructor(
    private readonly utilService: UtilService,
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
  ) {}

  // [0, 1000000) 之间的安全整数，左侧补零至 6 位
  private genCode() {
    return randomInt(0, 1000000).toString().padStart(6, '0')
  }

  // 获取 Redis 中验证码的 Key
  private getCodeKey(email: string) {
    return `email:code:${email}`
  }

  /** 发送邮箱验证码 */
  async sendEmailCode(email: string) {
    try {
      const code = this.genCode()
      const key = this.getCodeKey(email)

      await this.redisClient.setex(key, this.verificationCodeTTL, code)

      await this.utilService.sendMail({
        to: email,
        subject: '【Apiplayer】账号安全验证码',
        text: `你的验证码是 ${code} ，5 分钟内有效。如非本人操作，请忽略本邮件。`,
        html: `<p>你的验证码是 <strong>${code}</strong> ，5 分钟内有效。</p><p>如果不是你本人操作，请尽快检查账号安全。</p>`,
      })

      this.logger.log(`为邮箱 ${email} 发送了邮箱验证码`)
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }
      this.logger.error('发送邮箱验证码失败:', error)
      throw new HanaException('INTERNAL_SERVER_ERROR')
    }
  }

  /** 校验邮箱验证码 */
  async verifyEmailCode(email: string, code: string) {
    const key = this.getCodeKey(email)
    const storedCode = await this.redisClient.get(key)

    if (!storedCode || storedCode !== code) {
      throw new HanaException('INVALID_VERIFICATION_CODE')
    }

    // 校验通过后立即删除验证码
    await this.redisClient.del(key)
  }
}
