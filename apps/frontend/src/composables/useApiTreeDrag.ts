import type { ApiBrief, GroupNodeWithApis } from '@/types/api'
import { ref } from 'vue'
import { useApiTreeStore } from '@/stores/useApiTreeStore'

/** 拖拽项的类型 */
export type DragItemType = 'group' | 'api'

/** 放置位置类型：上方、下方、内部（作为子项） */
export type DropPosition = 'before' | 'after' | 'inside'

/** 拖拽项信息 */
export interface DragItem {
  id: string
  type: DragItemType
  parentId?: string
  data: GroupNodeWithApis | ApiBrief
}

/** 放置目标信息 */
export interface DropTarget {
  id: string
  type: DragItemType
  parentId?: string
  position: DropPosition
}

// ========== 模块级别的共享状态 ==========

/** 当前正在拖拽的项 */
const dragItem = ref<DragItem | null>(null)

/** 当前放置目标 */
const dropTarget = ref<DropTarget | null>(null)

/** 是否正在执行拖拽操作 */
const isDragging = ref(false)

/** 拖拽状态管理 composable */
export function useApiTreeDrag() {
  const apiTreeStore = useApiTreeStore()

  /** 开始拖拽 */
  function startDrag(item: DragItem) {
    dragItem.value = item
    isDragging.value = true
  }

  /** 结束拖拽 */
  function endDrag() {
    dragItem.value = null
    dropTarget.value = null
    isDragging.value = false
  }

  /** 设置放置目标 */
  function setDropTarget(target: DropTarget | null) {
    dropTarget.value = target
  }

  /**
   * 验证拖拽操作是否有效
   * @returns 是否允许放置
   */
  function isValidDrop(target: DropTarget): boolean {
    if (!dragItem.value)
      return false

    const drag = dragItem.value
    const drop = target

    // 不能拖拽到自己
    if (drag.id === drop.id)
      return false

    // 分组拖拽规则
    if (drag.type === 'group') {
      // 分组不能放置到 API 内部
      if (drop.type === 'api' && drop.position === 'inside')
        return false

      // 分组不能拖拽到 API 的上方或下方（分组之间排序，不能跟 API 混排）
      if (drop.type === 'api')
        return false

      // 不能把分组拖拽到自己的子分组内
      if (isDescendant(drag.id, drop.id))
        return false
    }

    // API 拖拽规则
    if (drag.type === 'api') {
      // API 不能放置到 API 内部（API 没有子节点）
      if (drop.type === 'api' && drop.position === 'inside')
        return false

      // API 放到分组上只能是 inside（进入分组）
      if (drop.type === 'group' && drop.position !== 'inside') {
        // API 可以在同一分组内的 API 之间排序
        // 但不能放到分组的上方或下方与分组排序
        return false
      }
    }

    return true
  }

  /**
   * 检查 parentId 是否是 childId 的后代（即 parentId 在 childId 的子树中）
   */
  function isDescendant(parentId: string, childId: string): boolean {
    /** 递归检查节点是否包含指定 ID */
    const containsGroup = (nodes: GroupNodeWithApis[], id: string): boolean => {
      for (const node of nodes) {
        if (node.id === id)
          return true
        if (containsGroup(node.children, id))
          return true
      }
      return false
    }

    /** 在树中查找目标节点并检查其子树 */
    const checkDescendant = (nodes: GroupNodeWithApis[], targetId: string): boolean => {
      for (const node of nodes) {
        if (node.id === targetId) {
          return containsGroup(node.children, parentId)
        }
        if (node.children.length > 0) {
          const found = checkDescendant(node.children, targetId)
          if (found)
            return true
        }
      }
      return false
    }

    return checkDescendant(apiTreeStore.tree, childId)
  }

  /**
   * 执行拖拽放置操作
   */
  async function executeDrop() {
    if (!dragItem.value || !dropTarget.value)
      return

    const drag = dragItem.value
    const drop = dropTarget.value

    if (!isValidDrop(drop))
      return

    try {
      if (drag.type === 'group') {
        await handleGroupDrop(drag, drop)
      }
      else {
        await handleApiDrop(drag, drop)
      }
    }
    finally {
      endDrag()
    }
  }

  /**
   * 处理分组的拖拽放置
   */
  async function handleGroupDrop(drag: DragItem, drop: DropTarget) {
    if (drop.type !== 'group')
      return

    if (drop.position === 'inside') {
      // 移动分组到目标分组内部
      await apiTreeStore.moveGroup(drag.id, drop.id)
    }
    else {
      // 在同级分组之间排序
      const siblings = getSiblingGroups(drop.parentId)
      const newOrder = calculateNewSortOrder(siblings, drop.id, drop.position, drag.id)

      // 如果父级发生变化，需要先移动再排序
      if (drag.parentId !== drop.parentId) {
        // 计算目标位置的 sortOrder
        const targetSortOrder = calculateNewSortOrderForInsert(siblings, drop.id, drop.position)
        await apiTreeStore.moveGroup(drag.id, drop.parentId ?? null, targetSortOrder)
      }
      else {
        // 同级分组批量更新排序
        await apiTreeStore.sortGroups(newOrder)
      }
    }
  }

  /**
   * 处理 API 的拖拽放置
   */
  async function handleApiDrop(drag: DragItem, drop: DropTarget) {
    if (drop.type === 'group') {
      // 移动 API 到目标分组
      await apiTreeStore.moveApi(drag.id, drop.id)
    }
    else if (drop.type === 'api') {
      // 在同一分组内的 API 之间排序
      if (drag.parentId === drop.parentId && drag.parentId) {
        const siblings = getSiblingApis(drag.parentId)
        const newOrder = calculateNewSortOrder(siblings, drop.id, drop.position, drag.id)
        await apiTreeStore.sortApis(newOrder)
      }
      else if (drop.parentId) {
        // 移动到其他分组并排序
        const siblings = getSiblingApis(drop.parentId)
        const newOrder = calculateNewSortOrderForInsert(siblings, drop.id, drop.position)
        await apiTreeStore.moveApi(drag.id, drop.parentId, newOrder)
      }
    }
  }

  /**
   * 获取同级分组
   */
  function getSiblingGroups(parentId?: string): { id: string, sortOrder: number }[] {
    if (!parentId) {
      // 根级别分组
      return apiTreeStore.tree.map(g => ({ id: g.id, sortOrder: g.sortOrder }))
    }

    const parent = apiTreeStore.findGroupInTree(apiTreeStore.tree, parentId)
    if (!parent)
      return []

    return parent.children.map(g => ({ id: g.id, sortOrder: g.sortOrder }))
  }

  /**
   * 获取同级 API
   */
  function getSiblingApis(groupId: string): { id: string, sortOrder: number }[] {
    const group = apiTreeStore.findGroupInTree(apiTreeStore.tree, groupId)
    if (!group)
      return []

    // API 没有 sortOrder，需要根据索引生成
    return group.apis.map((api, index) => ({ id: api.id, sortOrder: index }))
  }

  /**
   * 计算新的排序顺序
   */
  function calculateNewSortOrder(
    siblings: { id: string, sortOrder: number }[],
    targetId: string,
    position: DropPosition,
    dragId: string,
  ): { id: string, sortOrder: number }[] {
    // 过滤掉拖拽项
    const filtered = siblings.filter(s => s.id !== dragId)

    // 找到目标位置
    const targetIndex = filtered.findIndex(s => s.id === targetId)
    if (targetIndex === -1)
      return siblings

    // 计算插入位置
    const insertIndex = position === 'before' ? targetIndex : targetIndex + 1

    // 插入拖拽项
    filtered.splice(insertIndex, 0, { id: dragId, sortOrder: 0 })

    // 重新分配 sortOrder
    return filtered.map((item, index) => ({
      id: item.id,
      sortOrder: index,
    }))
  }

  /**
   * 计算插入到新分组的排序顺序
   */
  function calculateNewSortOrderForInsert(
    siblings: { id: string, sortOrder: number }[],
    targetId: string,
    position: DropPosition,
  ): number {
    const targetIndex = siblings.findIndex(s => s.id === targetId)
    if (targetIndex === -1)
      return siblings.length

    return position === 'before' ? targetIndex : targetIndex + 1
  }

  /**
   * 计算鼠标相对位置，确定放置位置
   * @param e 拖拽事件
   * @param element 目标元素
   * @param itemType 目标项类型
   * @returns 放置位置
   */
  function calculateDropPosition(
    e: DragEvent,
    element: HTMLElement,
    itemType: DragItemType,
  ): DropPosition {
    const rect = element.getBoundingClientRect()
    const y = e.clientY - rect.top
    const height = rect.height

    // 根据拖拽项和目标项类型决定可用的放置位置
    if (!dragItem.value)
      return 'inside'

    const dragType = dragItem.value.type

    // API 拖拽到分组：只能放进去
    if (dragType === 'api' && itemType === 'group') {
      return 'inside'
    }

    // API 拖拽到 API：上方或下方
    if (dragType === 'api' && itemType === 'api') {
      return y < height / 2 ? 'before' : 'after'
    }

    // 分组拖拽到分组
    if (dragType === 'group' && itemType === 'group') {
      // 上 1/4：放到上方
      if (y < height * 0.25)
        return 'before'
      // 下 1/4：放到下方
      if (y > height * 0.75)
        return 'after'
      // 中间：放进去
      return 'inside'
    }

    return 'inside'
  }

  return {
    // 状态（模块级别共享）
    dragItem,
    dropTarget,
    isDragging,

    // 方法
    startDrag,
    endDrag,
    setDropTarget,
    isValidDrop,
    executeDrop,
    calculateDropPosition,
  }
}

/**
 * 共享的拖拽 composable
 * 状态在模块级别共享，所有组件实例访问同一份状态
 */
export const useSharedApiTreeDrag = useApiTreeDrag
