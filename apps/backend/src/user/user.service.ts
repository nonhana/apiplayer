import { Inject, Injectable, Logger } from '@nestjs/common'
import Redis from 'ioredis'
import { UserUpdateInput, UserWhereInput } from 'prisma/generated/models'
import { AuthService } from '@/auth/auth.service'
import { HanaException } from '@/common/exceptions/hana.exception'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { REDIS_CLIENT } from '@/infra/redis/redis.module'
import { UtilService } from '@/util/util.service'
import { SearchUsersReqDto } from './dto/search-users.dto'
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
        throw new HanaException('USER_NOT_FOUND')
      }

      return user
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }
      throw new HanaException('INTERNAL_SERVER_ERROR')
    }
  }

  /** 发送用于修改邮箱 / 密码等敏感信息的邮箱验证码 */
  async sendProfileVerificationCode(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      })

      if (!user) {
        throw new HanaException('USER_NOT_FOUND')
      }

      if (!user.isActive) {
        throw new HanaException('ACCOUNT_DISABLED')
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
      throw new HanaException('INTERNAL_SERVER_ERROR')
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
        throw new HanaException('USER_NOT_FOUND')
      }

      if (!user.isActive) {
        throw new HanaException('ACCOUNT_DISABLED')
      }

      const requiresVerification = (!!newEmail && newEmail !== user.email) || !!newPassword

      // 如果存在敏感字段变更，则必须校验验证码
      if (requiresVerification) {
        if (!verificationCode) {
          throw new HanaException('INVALID_VERIFICATION_CODE')
        }

        const key = this.getVerificationCodeKey(userId)
        const storedCode = await this.redisClient.get(key)

        if (!storedCode || storedCode !== verificationCode) {
          throw new HanaException('INVALID_VERIFICATION_CODE')
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
          throw new HanaException('USERNAME_ALREADY_EXISTS')
        }

        updateData.username = username
      }

      if (newEmail && newEmail !== user.email) {
        const existingEmailUser = await this.prisma.user.findUnique({
          where: { email: newEmail },
        })

        if (existingEmailUser && existingEmailUser.id !== user.id) {
          throw new HanaException('EMAIL_ALREADY_REGISTERED')
        }

        updateData.email = newEmail
      }

      if (newPassword) {
        if (!confirmNewPassword || confirmNewPassword !== newPassword) {
          throw new HanaException('PASSWORD_MISMATCH')
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
      throw new HanaException('INTERNAL_SERVER_ERROR')
    }
  }

  /** 根据用户 ID 获取用户 */
  async getUserById(id: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id } })
      if (!user) {
        throw new HanaException('USER_NOT_FOUND')
      }
      if (!user.isActive) {
        throw new HanaException('ACCOUNT_DISABLED')
      }
      return user
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }
      this.logger.error('获取用户失败:', error)
      throw new HanaException('INTERNAL_SERVER_ERROR')
    }
  }

  /** 根据邮箱获取用户 */
  async getUserByEmail(email: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { email } })
      if (!user) {
        throw new HanaException('USER_NOT_FOUND')
      }
      if (!user.isActive) {
        throw new HanaException('ACCOUNT_DISABLED')
      }
      return user
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }
      this.logger.error('获取用户失败:', error)
      throw new HanaException('INTERNAL_SERVER_ERROR')
    }
  }

  /** 分页搜索用户 */
  async searchUsers(dto: SearchUsersReqDto) {
    const { page = 1, limit = 10, search, teamId, projectId } = dto

    try {
      const skip = (page - 1) * limit

      const whereCondition: UserWhereInput = {
        isActive: true,
        ...(search && {
          OR: [
            { username: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }),
        // 如果包含团队 ID 或项目 ID，则只查询这些团队或项目中的用户
        ...(teamId && { teamMembers: { some: { teamId } } }),
        ...(projectId && { projectMembers: { some: { projectId } } }),
      }

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where: whereCondition,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.user.count({ where: whereCondition }),
      ])

      const totalPages = Math.ceil(total / limit)

      return {
        users,
        total,
        pagination: {
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      }
    }
    catch (error) {
      this.logger.error(`搜索用户失败: ${error.message}`, error.stack)
      throw new HanaException('INTERNAL_SERVER_ERROR')
    }
  }
}
