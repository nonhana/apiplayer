import { Injectable, Logger } from '@nestjs/common'
import { APIOperationType, Prisma, VersionChangeType } from 'prisma/generated/client'
import { ErrorCode } from '@/common/exceptions/error-code'
import { HanaException } from '@/common/exceptions/hana.exception'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { ProjectUtilsService } from '@/project/utils.service'
import {
  CreateGroupReqDto,
  DeleteGroupReqDto,
  GetGroupWithAPIReqDto,
  MoveGroupReqDto,
  SortItemsReqDto,
  UpdateGroupReqDto,
} from './dto'
import { ApiUtilsService } from './utils.service'

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
    private readonly apiUtilsService: ApiUtilsService,
  ) {}

  /** 创建 API 分组 */
  async createGroup(dto: CreateGroupReqDto, projectId: string, userId: string) {
    try {
      await this.projectUtilsService.getProjectById(projectId)

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
  async getGroupTree(projectId: string) {
    try {
      await this.projectUtilsService.getProjectById(projectId)

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
        countMap.set(row.groupId as string, row._count?._all ?? 0)

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
  async getGroupTreeWithApis(dto: GetGroupWithAPIReqDto, projectId: string) {
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

  /** 更新分组 */
  async updateGroup(dto: UpdateGroupReqDto, groupId: string, projectId: string, userId: string) {
    try {
      await this.projectUtilsService.getProjectById(projectId)

      const existing = await this.prisma.aPIGroup.findUnique({
        where: { id: groupId },
      })

      if (!existing || existing.projectId !== projectId || existing.status !== 'ACTIVE') {
        throw new HanaException('分组不存在', ErrorCode.API_GROUP_NOT_FOUND, 404)
      }

      const updated = await this.prisma.aPIGroup.update({
        where: { id: groupId },
        data: {
          ...(dto.name && { name: dto.name }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        },
      })

      this.logger.log(`用户 ${userId} 更新了项目 ${projectId} 的分组 ${groupId}`)
      return updated
    }
    catch (error) {
      if (error instanceof HanaException)
        throw error
      this.logger.error(`更新分组失败: ${error.message}`, error.stack)
      throw new HanaException('更新分组失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /** 移动分组 */
  async moveGroup(dto: MoveGroupReqDto, groupId: string, projectId: string, userId: string) {
    const { newParentId, sortOrder } = dto

    try {
      await this.projectUtilsService.getProjectById(projectId)

      const group = await this.prisma.aPIGroup.findUnique({
        where: { id: groupId },
      })

      if (!group || group.projectId !== projectId || group.status !== 'ACTIVE') {
        throw new HanaException('分组不存在', ErrorCode.API_GROUP_NOT_FOUND, 404)
      }

      let parentIdToUpdate: string | undefined | null

      if (newParentId !== undefined) {
        if (newParentId === groupId) {
          throw new HanaException('分组不能移动到自身', ErrorCode.INVALID_PARAMS, 400)
        }

        if (newParentId) {
          const parent = await this.prisma.aPIGroup.findUnique({
            where: { id: newParentId },
          })

          if (!parent || parent.projectId !== projectId || parent.status !== 'ACTIVE') {
            throw new HanaException('目标父分组不存在', ErrorCode.API_GROUP_NOT_FOUND, 404)
          }

          // 校验不会形成环
          let currentParentId: string | null | undefined = parent.parentId
          while (currentParentId) {
            if (currentParentId === groupId) {
              throw new HanaException('不能将分组移动到其子分组下', ErrorCode.INVALID_PARAMS, 400)
            }
            const currentParent = await this.prisma.aPIGroup.findUnique({
              where: { id: currentParentId },
              select: { parentId: true },
            })
            currentParentId = currentParent?.parentId
          }
        }

        parentIdToUpdate = newParentId ?? null
      }

      const updated = await this.prisma.aPIGroup.update({
        where: { id: groupId },
        data: {
          ...(parentIdToUpdate !== undefined && { parentId: parentIdToUpdate }),
          ...(sortOrder !== undefined && { sortOrder }),
        },
      })

      this.logger.log(`用户 ${userId} 移动了项目 ${projectId} 的分组 ${groupId}`)
      return updated
    }
    catch (error) {
      if (error instanceof HanaException)
        throw error
      this.logger.error(`移动分组失败: ${error.message}`, error.stack)
      throw new HanaException('移动分组失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /** 删除分组 */
  async deleteGroup(dto: DeleteGroupReqDto, groupId: string, projectId: string, userId: string) {
    const { cascade = false } = dto

    try {
      await this.projectUtilsService.getProjectById(projectId)

      const group = await this.prisma.aPIGroup.findUnique({
        where: { id: groupId },
      })

      if (!group || group.projectId !== projectId || group.status !== 'ACTIVE') {
        throw new HanaException('分组不存在', ErrorCode.API_GROUP_NOT_FOUND, 404)
      }

      if (cascade) {
        // 级联删除：当前分组 + 所有子分组 + 这些分组下的 API
        const groups = await this.prisma.aPIGroup.findMany({
          where: { projectId, status: 'ACTIVE' },
        })

        const childrenMap = new Map<string, string[]>()
        for (const g of groups) {
          if (g.parentId) {
            if (!childrenMap.has(g.parentId))
              childrenMap.set(g.parentId, [])
            childrenMap.get(g.parentId)!.push(g.id)
          }
        }

        const idsToDelete = new Set<string>([groupId])
        const stack = [groupId]
        while (stack.length) {
          const cur = stack.pop()!
          const children = childrenMap.get(cur) || []
          for (const childId of children) {
            if (!idsToDelete.has(childId)) {
              idsToDelete.add(childId)
              stack.push(childId)
            }
          }
        }

        const targetIds = Array.from(idsToDelete)

        await this.prisma.$transaction(async (tx) => {
          await tx.aPIGroup.updateMany({
            where: { id: { in: targetIds } },
            data: { status: 'DELETED' },
          })

          const affectedApis = await tx.aPI.findMany({
            where: {
              projectId,
              groupId: { in: targetIds },
              recordStatus: 'ACTIVE',
            },
            select: { id: true },
          })

          if (affectedApis.length > 0) {
            for (const apiItem of affectedApis) {
              await this.apiUtilsService.createOperationLog(
                {
                  apiId: apiItem.id,
                  userId,
                  operation: APIOperationType.DELETE,
                  changes: [VersionChangeType.DELETE],
                  description: '级联删除分组时删除 API',
                },
                tx,
              )
            }

            await tx.aPI.updateMany({
              where: {
                projectId,
                groupId: { in: targetIds },
                recordStatus: 'ACTIVE',
              },
              data: { recordStatus: 'DELETED' },
            })
          }
        })

        this.logger.log(
          `用户 ${userId} 在项目 ${projectId} 中级联删除了分组 ${groupId} 及其子分组`,
        )
        return
      }

      // 非级联删除：要求分组无子分组且无 API
      const [childCount, apiCount] = await Promise.all([
        this.prisma.aPIGroup.count({
          where: {
            projectId,
            parentId: groupId,
            status: 'ACTIVE',
          },
        }),
        this.prisma.aPI.count({
          where: {
            projectId,
            groupId,
            recordStatus: 'ACTIVE',
          },
        }),
      ])

      if (childCount > 0 || apiCount > 0) {
        throw new HanaException(
          '分组包含子分组或 API，无法删除，请先移动或清空',
          ErrorCode.INVALID_PARAMS,
          400,
        )
      }

      await this.prisma.aPIGroup.update({
        where: { id: groupId },
        data: { status: 'DELETED' },
      })

      this.logger.log(`用户 ${userId} 删除了项目 ${projectId} 的分组 ${groupId}`)
    }
    catch (error) {
      if (error instanceof HanaException)
        throw error
      this.logger.error(`删除分组失败: ${error.message}`, error.stack)
      throw new HanaException('删除分组失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /** 批量更新分组排序 */
  async sortGroups(dto: SortItemsReqDto, projectId: string, userId: string) {
    try {
      await this.projectUtilsService.getProjectById(projectId)

      const ids = dto.items.map(item => item.id)

      const groups = await this.prisma.aPIGroup.findMany({
        where: {
          id: { in: ids },
          projectId,
          status: 'ACTIVE',
        },
        select: { id: true },
      })

      const validIds = new Set(groups.map(g => g.id))
      for (const id of ids) {
        if (!validIds.has(id)) {
          throw new HanaException('包含无效的分组 ID', ErrorCode.API_GROUP_NOT_FOUND, 404)
        }
      }

      await this.prisma.$transaction(async (tx) => {
        for (const item of dto.items) {
          await tx.aPIGroup.update({
            where: { id: item.id },
            data: { sortOrder: item.sortOrder },
          })
        }
      })

      this.logger.log(
        `用户 ${userId} 在项目 ${projectId} 中更新了 ${dto.items.length} 个分组的排序`,
      )
    }
    catch (error) {
      if (error instanceof HanaException)
        throw error
      this.logger.error(`更新分组排序失败: ${error.message}`, error.stack)
      throw new HanaException('更新分组排序失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }
}
