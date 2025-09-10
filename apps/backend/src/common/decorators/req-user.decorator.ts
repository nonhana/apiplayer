import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { User as PrismaUser } from '@prisma/client'
import { FastifyRequest } from 'fastify'

export const ReqUser = createParamDecorator(
  (key: keyof PrismaUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest() as FastifyRequest
    const user = request.user

    return key ? user?.[key] : user
  },
)
