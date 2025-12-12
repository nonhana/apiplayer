import type { ApiBrief, GroupNodeWithApis } from './api'

/** 拖拽项的类型 */
export type DragItemType = 'group' | 'api'

/** 放置位置类型：上方、下方、内部（作为子项） */
export type DropPosition = 'before' | 'after' | 'inside'

/** 拖拽项信息 */
export type DragItem = {
  id: string
  parentId?: string
} & (
  {
    type: 'group'
    data: GroupNodeWithApis
  } | {
    type: 'api'
    data: ApiBrief
  }
)

/** 普通放置目标（分组或 API） */
export interface DropItemNormal {
  id: string
  type: DragItemType
  parentId?: string
  position: DropPosition
}

/** 根级别放置目标 */
export interface DropItemRoot {
  type: 'root'
}

/** 放置目标信息 */
export type DropItem = DropItemNormal | DropItemRoot
