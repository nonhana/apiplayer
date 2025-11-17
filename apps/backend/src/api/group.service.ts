import { Injectable, Logger } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { ErrorCode } from '@/common/exceptions/error-code'
import { HanaException } from '@/common/exceptions/hana.exception'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { ProjectUtilsService } from '@/project/utils.service'
import { CreateGroupReqDto } from './dto/create-group.dto'
import { GetGroupWithAPIReqDto } from './dto/get-groups.dto'

interface TempGroupNode {
  id: string
  name: string
  sortOrder: number
  parentId?: string | null
  updatedAt: Date
  children: TempGroupNode[]
  apiCount: number
}

interface TempGroupNodeWithAPI {
  id: string
  name: string
  sortOrder: number
  parentId?: string | null
  updatedAt: Date
  children: TempGroupNodeWithAPI[]
  apiCount: number
  apis: any[]
}

@Injectable()
export class GroupService {
  private readonly logger = new Logger(GroupService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly projectUtilsService: ProjectUtilsService,
  ) {}

  /** 创建 API 分组 */
  async createGroup(dto: CreateGroupReqDto, projectId: string, userId: string) {
    try {
      await this.projectUtilsService.getProjectById(projectId)
      await this.projectUtilsService.checkUserProjectMembership(projectId, userId)

      if (dto.parentId) {
        const parent = await this.prisma.aPIGroup.findUnique({ where: { id: dto.parentId } })
        if (!parent || parent.projectId !== projectId || parent.status !== 'ACTIVE') {
          throw new HanaException('父分组不存在', ErrorCode.API_GROUP_NOT_FOUND, 404)
        }
      }

      const created = await this.prisma.aPIGroup.create({
        data: {
          projectId,
          parentId: dto.parentId ?? null,
          name: dto.name,
          description: dto.description ?? null,
          sortOrder: dto.sortOrder ?? 0,
        },
      })

      this.logger.log(`用户 ${userId} 在项目 ${projectId} 创建了分组 ${created.name}`)
      return created
    }
    catch (error) {
      if (error instanceof HanaException)
        throw error
      this.logger.error(`创建分组失败: ${error.message}`, error.stack)
      throw new HanaException('创建分组失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /** 获取分组树（含每组 API 数量统计） */
  async getGroupTree(projectId: string, userId: string) {
    try {
      await this.projectUtilsService.getProjectById(projectId)
      await this.projectUtilsService.checkUserProjectMembership(projectId, userId)

      const [groups, apiCounts] = await Promise.all([
        this.prisma.aPIGroup.findMany({
          where: { projectId, status: 'ACTIVE' },
          orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
        }),
        this.prisma.aPI.groupBy({
          by: ['groupId'],
          where: { projectId, recordStatus: 'ACTIVE' },
          _count: { _all: true },
        }),
      ])

      const countMap = new Map<string, number>()
      for (const row of apiCounts)
        countMap.set(row.groupId as string, (row as any)._count?._all ?? row._count?._all ?? 0)

      const nodeMap = new Map<string, TempGroupNode>()
      for (const g of groups) {
        nodeMap.set(g.id, {
          id: g.id,
          name: g.name,
          sortOrder: g.sortOrder,
          parentId: g.parentId,
          updatedAt: g.updatedAt,
          children: [],
          apiCount: countMap.get(g.id) ?? 0,
        })
      }

      const roots: TempGroupNode[] = []
      for (const node of nodeMap.values()) {
        if (node.parentId && nodeMap.has(node.parentId))
          nodeMap.get(node.parentId)!.children.push(node)
        else
          roots.push(node)
      }

      const sortNodes = (arr: TempGroupNode[]) => {
        arr.sort((a, b) => (a.sortOrder - b.sortOrder) || (b.updatedAt.getTime() - a.updatedAt.getTime()))
        for (const n of arr)
          sortNodes(n.children)
      }
      sortNodes(roots)

      return roots
    }
    catch (error) {
      if (error instanceof HanaException)
        throw error
      this.logger.error(`获取分组树失败: ${error.message}`, error.stack)
      throw new HanaException('获取分组树失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /** 获取分组树（含 API 聚合） */
  async getGroupTreeWithApis(dto: GetGroupWithAPIReqDto, projectId: string, userId: string) {
    const {
      subtreeRootId,
      maxDepth,
      includeCurrentVersion = false,
      apiMethod,
      apiStatus,
      search,
      apiLimitPerGroup,
    } = dto

    try {
      await this.projectUtilsService.getProjectById(projectId)
      await this.projectUtilsService.checkUserProjectMembership(projectId, userId)

      // 读取全部分组
      const groups = await this.prisma.aPIGroup.findMany({
        where: { projectId, status: 'ACTIVE' },
        orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
      })

      const childrenMap = new Map<string, string[]>()
      for (const g of groups) {
        if (g.parentId) {
          if (!childrenMap.has(g.parentId))
            childrenMap.set(g.parentId, [])
          childrenMap.get(g.parentId)!.push(g.id)
        }
      }

      const collectSubtree = (rootId: string) => {
        const set = new Set<string>([rootId])
        const stack = [rootId]
        while (stack.length) {
          const cur = stack.pop()!
          const children = childrenMap.get(cur) || []
          for (const c of children) {
            if (!set.has(c)) {
              set.add(c)
              stack.push(c)
            }
          }
        }
        return set
      }

      const allowedGroupIds = new Set<string>(
        subtreeRootId ? Array.from(collectSubtree(subtreeRootId)) : groups.map(g => g.id),
      )

      const filteredGroups = groups.filter(g => allowedGroupIds.has(g.id))

      // 查询条件
      const whereApi: Prisma.APIWhereInput = {
        projectId,
        recordStatus: 'ACTIVE',
        groupId: { in: Array.from(allowedGroupIds) },
        ...(apiMethod && { method: apiMethod }),
        ...(apiStatus && { status: apiStatus }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { path: { contains: search, mode: 'insensitive' } },
          ],
        }),
      }

      const apis = await this.prisma.aPI.findMany({
        where: whereApi,
        include: includeCurrentVersion ? { currentVersion: { include: { snapshot: true } } } : undefined,
        orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
      })

      // 分桶
      const bucket = new Map<string, typeof apis>()
      for (const api of apis) {
        if (!bucket.has(api.groupId))
          bucket.set(api.groupId, [])
        bucket.get(api.groupId)!.push(api)
      }

      const nodeMap = new Map<string, TempGroupNodeWithAPI>()
      for (const g of filteredGroups) {
        const groupApis = bucket.get(g.id) ?? []
        nodeMap.set(g.id, {
          id: g.id,
          name: g.name,
          sortOrder: g.sortOrder,
          parentId: g.parentId,
          updatedAt: g.updatedAt,
          children: [],
          apiCount: groupApis.length,
          apis: apiLimitPerGroup ? groupApis.slice(0, apiLimitPerGroup) : groupApis,
        })
      }

      const roots: TempGroupNodeWithAPI[] = []
      for (const node of nodeMap.values()) {
        if (node.parentId && nodeMap.has(node.parentId))
          nodeMap.get(node.parentId)!.children.push(node)
        else
          roots.push(node)
      }

      const sortNodes = (arr: TempGroupNodeWithAPI[], depth = 1) => {
        arr.sort((a, b) => (a.sortOrder - b.sortOrder) || (b.updatedAt.getTime() - a.updatedAt.getTime()))
        for (const n of arr) {
          if (!maxDepth || depth < maxDepth)
            sortNodes(n.children, depth + 1)
          else
            n.children = []
        }
      }
      sortNodes(roots)

      if (subtreeRootId && nodeMap.has(subtreeRootId))
        return [nodeMap.get(subtreeRootId)!]

      return roots
    }
    catch (error) {
      if (error instanceof HanaException)
        throw error
      this.logger.error(`获取分组树（含 API）失败: ${error.message}`, error.stack)
      throw new HanaException('获取分组树失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }
}
