import type { DragItem, DropItem } from '@/types/api-drag'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useApiDragStore = defineStore('apiDrag', () => {
  /** 当前正在拖拽的项 */
  const dragItem = ref<DragItem | null>(null)

  /** 当前放置目标 */
  const dropItem = ref<DropItem | null>(null)

  /** 是否正在执行拖拽操作 */
  const isDragging = ref(false)

  /** 开始拖拽 */
  function startDrag(item: DragItem) {
    dragItem.value = item
    isDragging.value = true
  }

  /** 结束拖拽 */
  function endDrag() {
    dragItem.value = null
    dropItem.value = null
    isDragging.value = false
  }

  /** 设置放置目标 */
  function setDropTarget(target: DropItem | null) {
    dropItem.value = target
  }

  return {
    // state
    dragItem,
    dropItem,
    isDragging,

    // actions
    startDrag,
    endDrag,
    setDropTarget,
  }
})

export type ApiDragStore = ReturnType<typeof useApiDragStore>
