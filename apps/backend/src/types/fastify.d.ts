import { UserDetailInfoDto } from '@/common/dto/user.dto'
import 'fastify'

declare module 'fastify' {
  interface FastifyRequest {
    user?: UserDetailInfoDto
    sessionId?: string
  }
}
