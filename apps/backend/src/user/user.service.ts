import { Inject, Injectable, Logger } from '@nestjs/common'
import Redis from 'ioredis'
import { UserUpdateInput } from 'prisma/generated/models'
import { AuthService } from '@/auth/auth.service'
import { ErrorCode } from '@/common/exceptions/error-code'
import { HanaException } from '@/common/exceptions/hana.exception'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { REDIS_CLIENT } from '@/infra/redis/redis.module'
import { UtilService } from '@/util/util.service'
import { UpdateUserProfileReqDto } from './dto/update-profile.dto'

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name)
  private readonly verificationCodeTTL = 5 * 60 // 5 分钟，单位：秒

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly utilService: UtilService,
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
  ) {}

  /** 生成用于安全操作的邮箱验证码 */
  private generateVerificationCode(): string {
    const code = Math.floor(100000 + Math.random() * 900000)
    return code.toString()
  }

  /** 获取用户验证码在 Redis 中的 key */
  private getVerificationCodeKey(userId: string): string {
    return `user:profile:verification:${userId}`
  }

  /** 获取用户详细资料 */
  async getUserProfile(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      })

      if (!user) {
        throw new HanaException('用户不存在', ErrorCode.USER_NOT_FOUND, 404)
      }

      return user
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }
      throw new HanaException('获取用户资料失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /** 发送用于修改邮箱 / 密码等敏感信息的邮箱验证码 */
  async sendProfileVerificationCode(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      })

      if (!user) {
        throw new HanaException('用户不存在', ErrorCode.USER_NOT_FOUND, 404)
      }

      if (!user.isActive) {
        throw new HanaException('账号已被禁用，无法发送验证码', ErrorCode.ACCOUNT_DISABLED, 403)
      }

      const code = this.generateVerificationCode()
      const key = this.getVerificationCodeKey(userId)

      // 将验证码写入 Redis，并设置过期时间
      await this.redisClient.setex(key, this.verificationCodeTTL, code)

      // 通过统一的邮件发送服务发送验证码
      await this.utilService.sendMail({
        to: user.email,
        subject: '【Apiplayer】账号安全验证码',
        text: `你的验证码是 ${code} ，5 分钟内有效。如非本人操作，请忽略本邮件。`,
        html: `<p>你的验证码是 <strong>${code}</strong> ，5 分钟内有效。</p><p>如果不是你本人操作，请尽快检查账号安全。</p>`,
      })

      this.logger.log(`为用户 ${user.id} 发送了邮箱验证码`)
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }
      this.logger.error('发送邮箱验证码失败:', error)
      throw new HanaException('发送验证码失败，请稍后重试', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /** 更新用户个人资料（邮箱 / 密码 变更需校验验证码） */
  async updateUserProfile(dto: UpdateUserProfileReqDto, userId: string) {
    const {
      name,
      username,
      avatar,
      bio,
      newEmail,
      newPassword,
      confirmNewPassword,
      verificationCode,
    } = dto

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      })

      if (!user) {
        throw new HanaException('用户不存在', ErrorCode.USER_NOT_FOUND, 404)
      }

      if (!user.isActive) {
        throw new HanaException('账号已被禁用，无法修改资料', ErrorCode.ACCOUNT_DISABLED, 403)
      }

      const requiresVerification = (!!newEmail && newEmail !== user.email) || !!newPassword

      // 如果存在敏感字段变更，则必须校验验证码
      if (requiresVerification) {
        if (!verificationCode) {
          throw new HanaException('修改邮箱或密码需要提供邮箱验证码', ErrorCode.INVALID_VERIFICATION_CODE, 400)
        }

        const key = this.getVerificationCodeKey(userId)
        const storedCode = await this.redisClient.get(key)

        if (!storedCode || storedCode !== verificationCode) {
          throw new HanaException('验证码错误或已过期', ErrorCode.INVALID_VERIFICATION_CODE, 400)
        }

        // 校验通过后立即失效，防止重复使用
        await this.redisClient.del(key)
      }

      const updateData: UserUpdateInput = {}

      if (name !== undefined) {
        updateData.name = name
      }

      if (avatar !== undefined) {
        updateData.avatar = avatar
      }

      if (bio !== undefined) {
        updateData.bio = bio
      }

      if (username && username !== user.username) {
        const existingUsernameUser = await this.prisma.user.findUnique({
          where: { username },
        })

        if (existingUsernameUser && existingUsernameUser.id !== user.id) {
          throw new HanaException('该用户名已被占用', ErrorCode.USERNAME_ALREADY_EXISTS, 409)
        }

        updateData.username = username
      }

      if (newEmail && newEmail !== user.email) {
        const existingEmailUser = await this.prisma.user.findUnique({
          where: { email: newEmail },
        })

        if (existingEmailUser && existingEmailUser.id !== user.id) {
          throw new HanaException('该邮箱已被注册', ErrorCode.EMAIL_ALREADY_REGISTERED, 409)
        }

        updateData.email = newEmail
      }

      if (newPassword) {
        if (!confirmNewPassword || confirmNewPassword !== newPassword) {
          throw new HanaException('两次密码输入不一致', ErrorCode.PASSWORD_MISMATCH, 400)
        }

        const hashedPassword = await this.authService.hashPassword(newPassword)
        updateData.password = hashedPassword
      }

      // 如果没有任何可更新字段，直接返回当前用户信息
      if (Object.keys(updateData).length === 0) {
        return user
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
      })

      this.logger.log(`用户 ${userId} 更新了个人资料`)

      return updatedUser
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }
      this.logger.error('更新用户个人资料失败:', error)
      throw new HanaException('更新用户个人资料失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /** 根据邮箱获取用户 */
  async getUserByEmail(email: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { email } })
      if (!user) {
        throw new HanaException('被邀请的用户不存在', ErrorCode.USER_NOT_FOUND, 404)
      }
      if (!user.isActive) {
        throw new HanaException('被邀请的用户账号已被禁用', ErrorCode.ACCOUNT_DISABLED)
      }
      return user
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }
      throw new HanaException('获取用户失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }
}
