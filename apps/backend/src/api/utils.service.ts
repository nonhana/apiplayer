import { Injectable } from '@nestjs/common'
import { ErrorCode } from '@/common/exceptions/error-code'
import { HanaException } from '@/common/exceptions/hana.exception'
import { PrismaService } from '@/infra/prisma/prisma.service'

@Injectable()
export class ApiUtilsService {
  constructor(private readonly prisma: PrismaService) {}

  /** 校验 API 分组是否存在 */
  async checkApiGroupExists(projectId: string, groupId: string) {
    const group = await this.prisma.aPIGroup.findUnique({
      where: { id: groupId },
    })
    if (!group || group.projectId !== projectId) {
      throw new HanaException('API 分组不存在', ErrorCode.API_GROUP_NOT_FOUND, 404)
    }
  }
}
