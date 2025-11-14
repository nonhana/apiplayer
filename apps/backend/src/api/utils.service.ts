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

  /** 生成下一个版本号 */
  genNextVersion(current?: string | null) {
    const fallback = 'v1.0.1'
    if (!current)
      return fallback
    const match = /^v(\d+)\.(\d+)\.(\d+)$/.exec(current)
    if (!match)
      return fallback
    const major = Number(match[1])
    const minor = Number(match[2])
    const patch = Number(match[3]) + 1
    return `v${major}.${minor}.${patch}`
  }
}
