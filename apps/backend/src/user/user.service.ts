import { Injectable } from '@nestjs/common'
import { ErrorCode } from '@/common/exceptions/error-code'
import { HanaException } from '@/common/exceptions/hana.exception'
import { PrismaService } from '@/infra/prisma/prisma.service'

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  /** 获取用户详细资料 */
  async getUserProfile(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          avatar: true,
          bio: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      if (!user) {
        throw new HanaException('用户不存在', ErrorCode.USER_NOT_FOUND, 404)
      }

      return user
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }
      throw new HanaException('获取用户资料失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }
}
