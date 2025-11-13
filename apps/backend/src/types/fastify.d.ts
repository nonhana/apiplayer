import { User } from '@prisma/client'
import 'fastify'

declare module 'fastify' {
  interface FastifyRequest {
    // TODO: 不能直接用 Prisma 的 User 类型，因为一些敏感字段需要隐藏
    user?: User
    sessionId?: string
  }
}
