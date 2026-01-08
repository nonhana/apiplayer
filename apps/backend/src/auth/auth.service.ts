import { Injectable, Logger } from '@nestjs/common'
import { compare, hash } from 'bcrypt'
import { ErrorCode } from '@/common/exceptions/error-code'
import { HanaException } from '@/common/exceptions/hana.exception'
import { DEFAULT_COOKIE_MAX_AGE, REMEMBER_ME_COOKIE_MAX_AGE } from '@/constants/cookie'
import { RoleName } from '@/constants/role'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { SessionService } from '@/session/session.service'
import { CheckAvailabilityReqDto, LoginReqDto, RegisterReqDto } from './dto'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)
  private readonly saltRounds = 12 // bcrypt 盐轮数

  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionService: SessionService,
  ) {}

  /** 对密码进行哈希处理 */
  async hashPassword(password: string) {
    return hash(password, this.saltRounds)
  }

  /** 验证密码 */
  async verifyPassword(password: string, hashedPassword: string) {
    return compare(password, hashedPassword)
  }

  /** 用户登录 */
  async login(
    dto: LoginReqDto,
    metadata?: { userAgent?: string, ip?: string },
  ) {
    const { email, password, rememberMe } = dto

    try {
      // 查找用户
      const user = await this.prisma.user.findUnique({ where: { email } })

      if (!user) {
        throw new HanaException('该邮箱未注册', ErrorCode.USER_NOT_FOUND, 401)
      }

      if (!user.isActive) {
        throw new HanaException('账户已被禁用，请联系管理员', ErrorCode.ACCOUNT_DISABLED, 403)
      }

      // 验证密码
      const isPasswordValid = await this.verifyPassword(password, user.password)
      if (!isPasswordValid) {
        throw new HanaException('密码错误', ErrorCode.INVALID_PASSWORD, 401)
      }

      // 创建Session，根据 rememberMe 设置不同的过期时间
      const idleTimeout = rememberMe ? REMEMBER_ME_COOKIE_MAX_AGE : DEFAULT_COOKIE_MAX_AGE
      const sessionOptions = { idleTimeout }

      const sessionId = await this.sessionService.createSession(
        user.id,
        sessionOptions,
        metadata,
      )

      // 更新最后登录时间
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      })

      this.logger.log(`用户 ${user.email} 登录成功`)

      return { user, sessionId, idleTimeout }
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }
      this.logger.error('登录失败:', error)
      throw new HanaException('登录失败，请稍后重试', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /** 用户登出 */
  async logout(sessionId: string) {
    try {
      const sessionData = await this.sessionService.getSession(sessionId)

      if (sessionData) {
        await this.sessionService.destroySession(sessionId)
        this.logger.log(`用户 ${sessionData.userId} 登出成功`)
      }
    }
    catch (error) {
      this.logger.error('登出失败:', error)
      throw new HanaException('登出失败，请稍后重试', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /** 登出所有设备 */
  async logoutAllDevices(userId: string) {
    try {
      const destroyedCount = await this.sessionService.destroyAllUserSessions(userId)
      this.logger.log(`用户 ${userId} 已登出所有设备，共销毁 ${destroyedCount} 个Session`)
      return destroyedCount
    }
    catch (error) {
      this.logger.error('登出所有设备失败:', error)
      throw new HanaException('登出所有设备失败，请稍后重试', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /** 验证Session并获取用户信息 */
  async validateSession(sessionId: string) {
    try {
      // 刷新Session（更新最后访问时间）
      const refreshResult = await this.sessionService.refreshSession(sessionId)

      if (!refreshResult.success)
        return null

      // 获取Session数据
      const sessionData = await this.sessionService.getSession(sessionId)

      if (!sessionData)
        return null

      // 获取用户详细信息
      const user = await this.prisma.user.findUnique({ where: { id: sessionData.userId } })

      if (!user || !user.isActive) {
        // 用户不存在或已被禁用，销毁Session
        await this.sessionService.destroySession(sessionId)
        return null
      }

      return {
        user,
        idleTimeout: refreshResult.idleTimeout,
      }
    }
    catch (error) {
      this.logger.error('验证Session失败:', error)
      return null
    }
  }

  /** 获取用户的活跃Session列表 */
  async getUserActiveSessions(userId: string, currentSessionId?: string) {
    try {
      const sessions = await this.sessionService.getUserActiveSessions(userId)

      return sessions.map(({ sessionId, data }) => ({
        sessionId,
        createdAt: new Date(data.createdAt),
        lastAccessed: new Date(data.lastAccessed),
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
        isCurrent: sessionId === currentSessionId,
      }))
    }
    catch (error) {
      this.logger.error('获取用户活跃Session失败:', error)
      throw new HanaException('获取Session列表失败，请稍后重试', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /** 销毁指定Session */
  async destroySpecificSession(userId: string, sessionId: string) {
    try {
      // 验证Session是否属于当前用户
      const sessionData = await this.sessionService.getSession(sessionId)

      if (!sessionData || sessionData.userId !== userId) {
        throw new HanaException('无权限操作此Session', ErrorCode.SESSION_FORBIDDEN, 403)
      }

      await this.sessionService.destroySession(sessionId)
      this.logger.log(`用户 ${userId} 销毁了Session ${sessionId}`)
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }
      this.logger.error('销毁指定Session失败:', error)
      throw new HanaException('销毁Session失败，请稍后重试', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /** 重新生成Session ID（防御Session固定攻击） */
  async regenerateSessionId(oldSessionId: string) {
    try {
      const newSessionId = await this.sessionService.regenerateSessionId(oldSessionId)

      if (newSessionId) {
        this.logger.log(`Session ID 重新生成: ${oldSessionId} -> ${newSessionId}`)
      }

      return newSessionId
    }
    catch (error) {
      this.logger.error('重新生成Session ID 失败:', error)
      return null
    }
  }

  /** 用户注册 */
  async register(dto: RegisterReqDto) {
    const { email, username, name, password, confirmPassword } = dto

    try {
      // 验证密码确认
      if (password !== confirmPassword) {
        throw new HanaException('两次密码输入不一致', ErrorCode.PASSWORD_MISMATCH, 400)
      }

      // 检查邮箱是否已被注册
      const existingEmailUser = await this.prisma.user.findUnique({ where: { email } })

      if (existingEmailUser) {
        throw new HanaException('该邮箱已被注册', ErrorCode.EMAIL_ALREADY_REGISTERED, 409)
      }

      // 检查用户名是否已被占用
      const existingUsernameUser = await this.prisma.user.findUnique({ where: { username } })

      if (existingUsernameUser) {
        throw new HanaException('该用户名已被占用', ErrorCode.USERNAME_ALREADY_EXISTS, 409)
      }

      // 哈希密码
      const hashedPassword = await this.hashPassword(password)

      // 获取团队所有者角色
      const ownerRole = await this.prisma.role.findUnique({
        where: { name: RoleName.TEAM_OWNER },
      })

      if (!ownerRole) {
        this.logger.error('团队所有者角色不存在，请检查角色种子数据')
        throw new HanaException('系统配置错误', ErrorCode.INTERNAL_SERVER_ERROR, 500)
      }

      const result = await this.prisma.$transaction(async (tx) => {
        // 创建用户
        const newUser = await tx.user.create({
          data: {
            email,
            username,
            name,
            password: hashedPassword,
            isActive: true,
          },
        })

        // 创建默认个人团队
        const personalTeam = await tx.team.create({
          data: {
            name: `${name}的个人团队`,
            slug: `personal-${username}`,
            description: '注册时自动创建的个人团队',
          },
        })

        // 将用户设为团队所有者
        await tx.teamMember.create({
          data: {
            userId: newUser.id,
            teamId: personalTeam.id,
            roleId: ownerRole.id,
          },
        })

        return { user: newUser, team: personalTeam }
      })

      this.logger.log(`新用户注册成功: ${result.user.email} (${result.user.username})，已创建个人团队: ${result.team.name}`)

      return result.user
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }
      this.logger.error('用户注册失败:', error)
      throw new HanaException('注册失败，请稍后重试', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /** 检查邮箱或用户名可用性 */
  async checkAvailability(dto: CheckAvailabilityReqDto) {
    try {
      const { email, username } = dto

      if (email) {
        const existingUser = await this.prisma.user.findUnique({ where: { email } })

        if (existingUser) {
          return {
            available: false,
            message: '该邮箱已被注册',
          }
        }

        return {
          available: true,
          message: '邮箱可以使用',
        }
      }

      if (username) {
        const existingUser = await this.prisma.user.findUnique({ where: { username } })

        if (existingUser) {
          return {
            available: false,
            message: '该用户名已被占用',
          }
        }

        return {
          available: true,
          message: '用户名可以使用',
        }
      }

      throw new HanaException('请提供邮箱或用户名进行检查', ErrorCode.INVALID_EMAIL, 400)
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }
      this.logger.error('检查可用性失败:', error)
      throw new HanaException('检查失败，请稍后重试', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }
}
