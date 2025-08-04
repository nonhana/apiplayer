import 'fastify'

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string
      email: string
      username: string
      name: string
      avatar: string | null
      roles: string[]
      isActive: boolean
      lastLoginAt: Date | null
      createdAt: Date
    }
    sessionId?: string
  }
}
