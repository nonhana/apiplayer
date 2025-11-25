import { createParamDecorator } from '@nestjs/common'
import { FastifyRequest } from 'fastify'
import { User } from 'prisma/generated/client'

export const ReqUser = createParamDecorator(
  (key: keyof User | undefined, ctx) => {
    const request = ctx.switchToHttp().getRequest() as FastifyRequest
    const user = request.user

    return key ? user?.[key] : user
  },
)
