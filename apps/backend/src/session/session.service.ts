import { randomBytes } from 'node:crypto'
import { Inject, Injectable, Logger } from '@nestjs/common'
import Redis from 'ioredis'
import { REDIS_CLIENT } from '@/infra/redis/redis.module'

export interface SessionData {
  userId: string
  createdAt: number
  lastAccessed: number
  userAgent?: string
  ipAddress?: string
}

export interface SessionOptions {
  /** 空闲超时时间（秒），默认30分钟 */
  idleTimeout?: number
  /** 绝对超时时间（秒），默认8小时 */
  absoluteTimeout?: number
  /** Session ID 长度（字节），默认32字节 */
  sessionIdLength?: number
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name)
  private readonly defaultOptions: Required<SessionOptions> = {
    idleTimeout: 30 * 60, // 30分钟
    absoluteTimeout: 8 * 60 * 60, // 8小时
    sessionIdLength: 32, // 32字节 = 256位
  }

  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
  ) {}

  /** 生成 Session ID */
  private generateSessionId(length = this.defaultOptions.sessionIdLength): string {
    return randomBytes(length).toString('hex')
  }

  /** 获取 Session 在 Redis 中的 key */
  private getSessionKey(sessionId: string): string {
    return `session:${sessionId}`
  }

  /** 获取用户所有 Session 列表的 key */
  private getUserSessionsKey(userId: string): string {
    return `user_sessions:${userId}`
  }

  /** 创建 Session */
  async createSession(
    userId: string,
    options: SessionOptions = {},
    metadata?: { userAgent?: string, ipAddress?: string },
  ): Promise<string> {
    const sessionId = this.generateSessionId(options.sessionIdLength)
    const now = Date.now()
    const mergedOptions = { ...this.defaultOptions, ...options }

    const sessionData: SessionData = {
      userId,
      createdAt: now,
      lastAccessed: now,
      userAgent: metadata?.userAgent,
      ipAddress: metadata?.ipAddress,
    }

    this.logger.log(`创建 Session: ${JSON.stringify(sessionData, null, 2)}`)

    const sessionKey = this.getSessionKey(sessionId)
    const userSessionsKey = this.getUserSessionsKey(userId)

    try {
      const multi = this.redisClient.multi()
      multi.hset(sessionKey, sessionData)
      multi.expire(sessionKey, mergedOptions.idleTimeout)
      multi.sadd(userSessionsKey, sessionId)
      multi.expire(userSessionsKey, mergedOptions.absoluteTimeout)
      await multi.exec()
      this.logger.log(`为用户 ${userId} 创建了新的Session: ${sessionId}`)
      return sessionId
    }
    catch (error) {
      this.logger.error('创建Session失败:', error)
      throw new Error('Session创建失败')
    }
  }

  /** 获取Session数据 */
  async getSession(sessionId: string): Promise<SessionData | null> {
    try {
      const sessionKey = this.getSessionKey(sessionId)
      const data = await this.redisClient.hgetall(sessionKey)

      if (!data || Object.keys(data).length === 0) {
        return null
      }

      return {
        userId: data.userId,
        createdAt: Number(data.createdAt),
        lastAccessed: Number(data.lastAccessed),
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
      }
    }
    catch (error) {
      this.logger.error('获取Session失败:', error)
      return null
    }
  }

  /** 刷新Session（更新最后访问时间并重置过期时间） */
  async refreshSession(
    sessionId: string,
    options: SessionOptions = {},
  ): Promise<boolean> {
    try {
      const sessionKey = this.getSessionKey(sessionId)
      const mergedOptions = { ...this.defaultOptions, ...options }

      // 检查Session是否存在
      const exists = await this.redisClient.exists(sessionKey)
      if (!exists) {
        return false
      }

      // 检查绝对超时
      const createdAt = await this.redisClient.hget(sessionKey, 'createdAt')
      if (createdAt) {
        const now = Date.now()
        const sessionAge = (now - Number(createdAt)) / 1000

        if (sessionAge > mergedOptions.absoluteTimeout) {
          await this.destroySession(sessionId)
          this.logger.log(`Session ${sessionId} 已达到绝对超时时间，已删除`)
          return false
        }
      }

      // 更新最后访问时间并重置过期时间
      const multi = this.redisClient.multi()
      multi.hset(sessionKey, 'lastAccessed', Date.now())
      multi.expire(sessionKey, mergedOptions.idleTimeout)
      await multi.exec()

      return true
    }
    catch (error) {
      this.logger.error('刷新Session失败:', error)
      return false
    }
  }

  /** 销毁单个Session */
  async destroySession(sessionId: string): Promise<boolean> {
    try {
      const sessionKey = this.getSessionKey(sessionId)

      // 先获取用户 ID
      const userId = await this.redisClient.hget(sessionKey, 'userId')

      // 删除Session
      const deleted = await this.redisClient.del(sessionKey)

      // 从用户的Session列表中移除
      if (userId) {
        const userSessionsKey = this.getUserSessionsKey(userId)
        await this.redisClient.srem(userSessionsKey, sessionId)
      }

      this.logger.log(`Session ${sessionId} 已销毁`)
      return deleted > 0
    }
    catch (error) {
      this.logger.error('销毁Session失败:', error)
      return false
    }
  }

  /** 销毁用户的所有Session（登出所有设备） */
  async destroyAllUserSessions(userId: string): Promise<number> {
    try {
      const userSessionsKey = this.getUserSessionsKey(userId)
      const sessionIds = await this.redisClient.smembers(userSessionsKey)

      if (sessionIds.length === 0) {
        return 0
      }

      // 批量删除所有Session
      const sessionKeys = sessionIds.map(id => this.getSessionKey(id))
      await this.redisClient.del(...sessionKeys, userSessionsKey)

      this.logger.log(`用户 ${userId} 的 ${sessionIds.length} 个Session已全部销毁`)
      return sessionIds.length
    }
    catch (error) {
      this.logger.error('销毁用户所有Session失败:', error)
      return 0
    }
  }

  /** 获取用户的所有活跃Session */
  async getUserActiveSessions(userId: string): Promise<{ sessionId: string, data: SessionData }[]> {
    try {
      const userSessionsKey = this.getUserSessionsKey(userId)
      const sessionIds = await this.redisClient.smembers(userSessionsKey)

      const sessions: { sessionId: string, data: SessionData }[] = []

      for (const sessionId of sessionIds) {
        const data = await this.getSession(sessionId)
        if (data) {
          sessions.push({ sessionId, data })
        }
        else {
          // 清理无效的Session ID
          await this.redisClient.srem(userSessionsKey, sessionId)
        }
      }

      return sessions
    }
    catch (error) {
      this.logger.error('获取用户活跃Session失败:', error)
      return []
    }
  }

  /** 更换Session ID（防御Session固定攻击） */
  async regenerateSessionId(oldSessionId: string): Promise<string | null> {
    try {
      const oldSessionData = await this.getSession(oldSessionId)

      if (!oldSessionData) {
        return null
      }

      // 生成新的 Session ID
      const newSessionId = this.generateSessionId()

      // 复制Session数据到新 Session
      const newSessionKey = this.getSessionKey(newSessionId)
      const oldSessionKey = this.getSessionKey(oldSessionId)

      const multi = this.redisClient.multi()

      // 复制数据
      const sessionData = await this.redisClient.hgetall(oldSessionKey)
      multi.hset(newSessionKey, sessionData)

      // 设置过期时间
      const ttl = await this.redisClient.ttl(oldSessionKey)
      if (ttl > 0) {
        multi.expire(newSessionKey, ttl)
      }

      // 更新用户Session列表
      const userSessionsKey = this.getUserSessionsKey(oldSessionData.userId)
      multi.srem(userSessionsKey, oldSessionId)
      multi.sadd(userSessionsKey, newSessionId)

      // 删除旧Session
      multi.del(oldSessionKey)

      await multi.exec()

      this.logger.log(`Session ID 已更换: ${oldSessionId} -> ${newSessionId}`)
      return newSessionId
    }
    catch (error) {
      this.logger.error('更换Session ID 失败:', error)
      return null
    }
  }
}
