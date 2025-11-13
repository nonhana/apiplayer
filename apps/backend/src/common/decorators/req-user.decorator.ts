import { createParamDecorator } from '@nestjs/common'
import { User } from '@prisma/client'
import { FastifyRequest } from 'fastify'

export const ReqUser = createParamDecorator(
  (key: keyof User | undefined, ctx) => {
    const request = ctx.switchToHttp().getRequest() as FastifyRequest
    const user = request.user

    return key ? user?.[key] : user
  },
)
