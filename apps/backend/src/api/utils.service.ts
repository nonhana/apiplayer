import { Injectable } from '@nestjs/common'
import { APIOperationType, Prisma, VersionChangeType } from 'prisma/generated/client'
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
      throw new HanaException('API_GROUP_NOT_FOUND')
    }
  }

  /** 生成下一个版本号 */
  genNextVersion(current?: string | null, type: 'major' | 'minor' | 'patch' = 'patch') {
    const fallback = 'v1.0.1'
    if (!current)
      return fallback
    const match = /^v(\d+)\.(\d+)\.(\d+)$/.exec(current)
    if (!match)
      return fallback

    const [major, minor, patch] = match.slice(1).map(Number)
    switch (type) {
      case 'major': return `v${major + 1}.0.0`
      case 'minor': return `v${major}.${minor + 1}.0`
      case 'patch': return `v${major}.${minor}.${patch + 1}`
    }
  }

  /** 记录 API 操作日志 */
  async createOperationLog(
    params: {
      apiId: string
      userId: string
      operation: APIOperationType
      versionId?: string | null
      changes?: VersionChangeType[]
      description?: string
      metadata?: Prisma.JsonValue
    },
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma

    await client.aPIOperationLog.create({
      data: {
        apiId: params.apiId,
        userId: params.userId,
        operation: params.operation,
        versionId: params.versionId ?? null,
        changes: params.changes ?? [],
        description: params.description,
        metadata: params.metadata ?? undefined,
      },
    })
  }

  /** 比较两个版本，保留变化的数据 */
  buildVersionDiff<T>(
    fromSnap: T | null,
    toSnap: T | null,
  ): Record<string, Partial<T>> {
    type InfoType = 'baseInfo' | 'coreInfo'

    const result: Record<InfoType, Partial<T>> = {
      baseInfo: {},
      coreInfo: {},
    }

    const pick = (snap: T | null, key: string) =>
      snap && typeof snap === 'object' ? snap[key] ?? null : null

    const compareField = (
      section: InfoType,
      key: string,
    ) => {
      const fromValue = pick(fromSnap, key)
      const toValue = pick(toSnap, key)

      const changed = JSON.stringify(fromValue) !== JSON.stringify(toValue)
      if (changed) {
        result[section][key] = {
          from: fromValue,
          to: toValue,
        }
      }
    }

    // 基本信息字段
    ;[
      'name',
      'description',
      'method',
      'status',
      'path',
      'tags',
      'sortOrder',
    ].forEach(field => compareField('baseInfo', field))

    // 核心信息字段
    ;[
      'requestHeaders',
      'pathParams',
      'queryParams',
      'requestBody',
      'responses',
      'examples',
      'mockConfig',
    ].forEach(field => compareField('coreInfo', field))

    return result
  }
}
