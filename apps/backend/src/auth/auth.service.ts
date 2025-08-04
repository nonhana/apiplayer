import { Inject, Injectable, Logger } from '@nestjs/common'
import { compare, hash } from 'bcrypt'
import { ErrorCode } from '@/common/exceptions/error-code'
import { HanaException } from '@/common/exceptions/hana.exception'
import { PrismaService } from '@/common/prisma/prisma.service'
import { SessionService } from '@/session/session.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto, RegisterResponseDto } from './dto/register.dto'
import {
  CheckAvailabilityDto,
  CheckAvailabilityResponseDto,
  CurrentUserResponseDto,
  UserSessionDto,
} from './dto/utils.dto'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)
  private readonly saltRounds = 12 // bcrypt 盐轮数

  @Inject(PrismaService)
  private readonly prisma: PrismaService

  @Inject(SessionService)
  private readonly sessionService: SessionService

  /** 对密码进行哈希处理 */
  async hashPassword(password: string): Promise<string> {
    return hash(password, this.saltRounds)
  }

  /** 验证密码 */
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return compare(password, hashedPassword)
  }

  /** 用户登录 */
  async login(
    loginDto: LoginDto,
    metadata?: { userAgent?: string, ipAddress?: string },
  ): Promise<{ user: CurrentUserResponseDto, sessionId: string }> {
    const { email, password, rememberMe } = loginDto

    try {
      // 查找用户
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          password: true,
          avatar: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
      })

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

      // 获取用户角色（这里简化处理，实际可能需要复杂的权限查询）
      const roles = ['user'] // 可以根据实际业务扩展

      // 创建会话
      const sessionOptions = rememberMe
        ? { idleTimeout: 30 * 24 * 60 * 60 } // 记住我：30天
        : undefined // 使用默认配置

      const sessionId = await this.sessionService.createSession(
        user.id,
        roles,
        sessionOptions,
        metadata,
      )

      // 更新最后登录时间
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      })

      this.logger.log(`用户 ${user.email} 登录成功`)

      // 返回用户信息（不包含密码）
      const userResponse: CurrentUserResponseDto = {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        avatar: user.avatar,
        roles,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      }

      return { user: userResponse, sessionId }
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
  async logout(sessionId: string): Promise<void> {
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
  async logoutAllDevices(userId: string): Promise<number> {
    try {
      const destroyedCount = await this.sessionService.destroyAllUserSessions(userId)
      this.logger.log(`用户 ${userId} 已登出所有设备，共销毁 ${destroyedCount} 个会话`)
      return destroyedCount
    }
    catch (error) {
      this.logger.error('登出所有设备失败:', error)
      throw new HanaException('登出所有设备失败，请稍后重试', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /** 验证会话并获取用户信息 */
  async validateSession(sessionId: string): Promise<CurrentUserResponseDto | null> {
    try {
      // 刷新会话（更新最后访问时间）
      const isValid = await this.sessionService.refreshSession(sessionId)

      if (!isValid) {
        return null
      }

      // 获取会话数据
      const sessionData = await this.sessionService.getSession(sessionId)

      if (!sessionData) {
        return null
      }

      // 获取用户详细信息
      const user = await this.prisma.user.findUnique({
        where: { id: sessionData.userId },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          avatar: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
      })

      if (!user || !user.isActive) {
        // 用户不存在或已被禁用，销毁会话
        await this.sessionService.destroySession(sessionId)
        return null
      }

      return {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        avatar: user.avatar,
        roles: sessionData.roles,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      }
    }
    catch (error) {
      this.logger.error('验证会话失败:', error)
      return null
    }
  }

  /** 获取用户的活跃会话列表 */
  async getUserActiveSessions(userId: string, currentSessionId?: string): Promise<UserSessionDto[]> {
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
      this.logger.error('获取用户活跃会话失败:', error)
      throw new HanaException('获取会话列表失败，请稍后重试', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /** 销毁指定会话 */
  async destroySpecificSession(userId: string, sessionId: string): Promise<void> {
    try {
      // 验证会话是否属于当前用户
      const sessionData = await this.sessionService.getSession(sessionId)

      if (!sessionData || sessionData.userId !== userId) {
        throw new HanaException('无权限操作此会话', ErrorCode.SESSION_FORBIDDEN, 403)
      }

      await this.sessionService.destroySession(sessionId)
      this.logger.log(`用户 ${userId} 销毁了会话 ${sessionId}`)
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }
      this.logger.error('销毁指定会话失败:', error)
      throw new HanaException('销毁会话失败，请稍后重试', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /** 重新生成会话 ID（防御会话固定攻击） */
  async regenerateSessionId(oldSessionId: string): Promise<string | null> {
    try {
      const newSessionId = await this.sessionService.regenerateSessionId(oldSessionId)

      if (newSessionId) {
        this.logger.log(`会话 ID 重新生成: ${oldSessionId} -> ${newSessionId}`)
      }

      return newSessionId
    }
    catch (error) {
      this.logger.error('重新生成会话 ID 失败:', error)
      return null
    }
  }

  /** 用户注册 */
  async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    const { email, username, name, password, confirmPassword } = registerDto

    try {
      // 验证密码确认
      if (password !== confirmPassword) {
        throw new HanaException('两次密码输入不一致', ErrorCode.PASSWORD_MISMATCH, 400)
      }

      // 检查邮箱是否已被注册
      const existingEmailUser = await this.prisma.user.findUnique({
        where: { email },
      })

      if (existingEmailUser) {
        throw new HanaException('该邮箱已被注册', ErrorCode.EMAIL_ALREADY_REGISTERED, 409)
      }

      // 检查用户名是否已被占用
      const existingUsernameUser = await this.prisma.user.findUnique({
        where: { username },
      })

      if (existingUsernameUser) {
        throw new HanaException('该用户名已被占用', ErrorCode.USERNAME_ALREADY_EXISTS, 409)
      }

      // 哈希密码
      const hashedPassword = await this.hashPassword(password)

      // 创建用户
      const newUser = await this.prisma.user.create({
        data: {
          email,
          username,
          name,
          password: hashedPassword,
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          avatar: true,
          createdAt: true,
        },
      })

      this.logger.log(`新用户注册成功: ${newUser.email} (${newUser.username})`)

      return {
        message: '注册成功！',
        user: newUser,
      }
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
  async checkAvailability(checkDto: CheckAvailabilityDto): Promise<CheckAvailabilityResponseDto> {
    try {
      const { email, username } = checkDto

      if (email) {
        const existingUser = await this.prisma.user.findUnique({
          where: { email },
        })

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
        const existingUser = await this.prisma.user.findUnique({
          where: { username },
        })

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
