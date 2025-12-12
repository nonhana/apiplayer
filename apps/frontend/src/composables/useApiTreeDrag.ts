import type { ApiDragStore } from '@/stores/useApiDragStore'
import type { ApiTreeStore } from '@/stores/useApiTreeStore'
import type { GroupNodeWithApis } from '@/types/api'
import type { DragItemType, DropItem, DropPosition } from '@/types/api-drag'
import { computed } from 'vue'

// 拖拽核心规则：
// 对于 Group：
// - 不能放置到 API 内部
// - 不能拖拽到 API 的上方或下方（分组之间排序，不能跟 API 混排）
// - 不能把分组拖拽到自己的子分组内
// 对于 API：
// - 不能放置到 API 内部（API 没有子节点）
// - 不能放到分组上只能是 inside（进入分组）
// - 可以在同一分组内的 API 之间排序
// - 但不能放到分组的上方或下方与分组排序

// DI 的形式注入 Store
export function useApiTreeDrag(
  apiDragStore: ApiDragStore,
  apiTreeStore: ApiTreeStore,
) {
  const drag = computed(() => apiDragStore.dragItem)
  const drop = computed(() => apiDragStore.dropItem)

  /** 检查拖拽项是否是放置目标的子项 */
  function isChildGroup(dragId: string, dropId: string) {
    const isContainGroup = (nodes: GroupNodeWithApis[], id: string): boolean => {
      for (const node of nodes) {
        if (node.id === id)
          return true
        if (isContainGroup(node.children, id))
          return true
      }
      return false
    }

    const checkChildGroup = (nodes: GroupNodeWithApis[], id: string): boolean => {
      for (const node of nodes) {
        if (node.id === id) {
          return isContainGroup(node.children, dragId)
        }
        if (node.children.length > 0) {
          const found = checkChildGroup(node.children, id)
          if (found)
            return true
        }
      }
      return false
    }

    return checkChildGroup(apiTreeStore.tree, dropId)
  }

  /** 处理 group 的拖拽放置 */
  async function handleGroupDrop() {
    if (!drag.value || !drop.value || drop.value.type !== 'group')
      return

    if (drop.value.position === 'inside') {
      // 移动分组到目标分组内部
      await apiTreeStore.moveGroup(drag.value.id, drop.value.id)
    }
    else {
      // 在同级分组之间排序
      const siblings = getSiblingGroups(drop.value.parentId)
      const newOrder = calcOrderList(siblings, drop.value.id, drop.value.position, drag.value.id)

      // 如果父级发生变化，需要先移动再排序
      if (drag.value.parentId !== drop.value.parentId) {
        // 计算目标位置的 sortOrder
        const targetSortOrder = calcInsertOrder(siblings, drop.value.id, drop.value.position)
        await apiTreeStore.moveGroup(drag.value.id, drop.value.parentId ?? null, targetSortOrder)
      }
      else {
        // 同级分组批量更新排序
        await apiTreeStore.sortGroups(newOrder)
      }
    }
  }

  /** 处理 api 的拖拽放置 */
  async function handleApiDrop() {
    if (!drag.value || !drop.value)
      return

    if (drop.value.type === 'group') {
      // 如果是直接放到 group，默认放到顶部符合用户直觉
      await apiTreeStore.moveApi(drag.value.id, drop.value.id, 0)
    }
    else if (drop.value.type === 'api') {
      // 在同一分组内的 API 之间排序
      if (drag.value.parentId === drop.value.parentId && drag.value.parentId) {
        const siblings = getSiblingApis(drag.value.parentId)
        const newOrder = calcOrderList(siblings, drop.value.id, drop.value.position, drag.value.id)
        await apiTreeStore.sortApis(newOrder)
      }
      else if (drop.value.parentId) {
        // 移动到其他分组并排序
        const siblings = getSiblingApis(drop.value.parentId)
        const newOrder = calcInsertOrder(siblings, drop.value.id, drop.value.position)
        await apiTreeStore.moveApi(drag.value.id, drop.value.parentId, newOrder)
      }
    }
  }

  /** 获取同级 groups */
  function getSiblingGroups(parentId?: string): { id: string, sortOrder: number }[] {
    if (!parentId)
      return apiTreeStore.tree.map(g => ({ id: g.id, sortOrder: g.sortOrder }))

    const parent = apiTreeStore.findGroupInTree(apiTreeStore.tree, parentId)
    if (!parent)
      return []

    return parent.children.map(g => ({ id: g.id, sortOrder: g.sortOrder }))
  }

  /** 获取同级 apis */
  function getSiblingApis(groupId: string): { id: string, sortOrder: number }[] {
    const group = apiTreeStore.findGroupInTree(apiTreeStore.tree, groupId)
    if (!group)
      return []

    return group.apis.map(api => ({ id: api.id, sortOrder: api.sortOrder }))
  }

  /** 计算新的排序顺序 */
  function calcOrderList(
    siblings: { id: string, sortOrder: number }[],
    targetId: string,
    pos: DropPosition,
    dragId: string,
  ): { id: string, sortOrder: number }[] {
    // 过滤掉拖拽项
    const filtered = siblings.filter(s => s.id !== dragId)

    // 找到目标位置
    const targetIndex = filtered.findIndex(s => s.id === targetId)
    if (targetIndex === -1)
      return siblings

    // 计算插入位置
    const insertIndex = pos === 'before' ? targetIndex : targetIndex + 1

    // 插入拖拽项
    filtered.splice(insertIndex, 0, { id: dragId, sortOrder: 0 })

    // 重新分配 sortOrder
    return filtered.map((item, index) => ({
      id: item.id,
      sortOrder: index,
    }))
  }

  /** 计算插入到新分组的排序顺序 */
  function calcInsertOrder(
    siblings: { id: string, sortOrder: number }[],
    targetId: string,
    pos: DropPosition,
  ): number {
    const targetIndex = siblings.findIndex(s => s.id === targetId)
    if (targetIndex === -1)
      return siblings.length

    return pos === 'before' ? targetIndex : targetIndex + 1
  }

  /** 是否允许放置到当前目标 */
  function isValidDrop(target: DropItem) {
    if (!drag.value)
      return false

    // 拖拽到自己直接无效
    if (drag.value.id === target.id)
      return false

    // 分组拖拽规则
    if (drag.value.type === 'group') {
      // 分组不能放置到 API 内部
      if (target.type === 'api' && target.position === 'inside')
        return false

      // 分组不能拖拽到 API 的上方或下方（分组之间排序，不能跟 API 混排）
      if (target.type === 'api')
        return false

      // 不能把分组拖拽到自己的子分组内
      if (isChildGroup(drag.value.id, target.id))
        return false
    }

    // API 拖拽规则
    if (drag.value.type === 'api') {
      // API 不能放置到 API 内部（API 没有子节点）
      if (target.type === 'api' && target.position === 'inside')
        return false

      // API 放到分组上只能是 inside（进入分组）
      if (target.type === 'group' && target.position !== 'inside') {
        // API 可以在同一分组内的 API 之间排序
        // 但不能放到分组的上方或下方与分组排序
        return false
      }
    }

    return true
  }

  /** 执行拖拽放置操作 */
  async function executeDrop() {
    if (!drag.value || !drop.value || !isValidDrop(drop.value))
      return

    try {
      if (drag.value.type === 'group') {
        await handleGroupDrop()
      }
      else {
        await handleApiDrop()
      }
    }
    finally {
      apiDragStore.endDrag()
    }
  }

  /**
   * 计算鼠标相对位置，确定放置位置
   * @param e 拖拽事件
   * @param el 目标元素
   * @param itemType 目标项类型
   * @returns 放置位置
   */
  function getDropPos(
    e: DragEvent,
    el: HTMLElement,
    itemType: DragItemType,
  ): DropPosition {
    const rect = el.getBoundingClientRect()
    const y = e.clientY - rect.top
    const height = rect.height

    // 根据拖拽项和目标项类型决定可用的放置位置
    if (!drag.value)
      return 'inside'

    const dragType = drag.value.type

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
    isValidDrop,
    executeDrop,
    getDropPos,
  }
}
