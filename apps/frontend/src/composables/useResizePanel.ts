import type { StyleValue } from 'vue'
import { useEventListener, useStorage } from '@vueuse/core'
import { computed, ref } from 'vue'

export interface ResizePanelOptions {
  /** 存储键名（用于持久化） */
  storageKey?: string
  /** 默认宽度 */
  defaultWidth?: number
  /** 最小宽度 */
  minWidth?: number
  /** 最大宽度 */
  maxWidth?: number
  /** 拖拽方向：'left' 表示从左边缘拖拽，'right' 表示从右边缘拖拽 */
  direction?: 'left' | 'right'
}

export function useResizePanel(options: ResizePanelOptions = {}) {
  const {
    storageKey,
    defaultWidth = 256,
    minWidth = 200,
    maxWidth = 480,
    direction = 'right',
  } = options

  const width = storageKey
    ? useStorage(storageKey, defaultWidth)
    : ref(defaultWidth)

  const isResizing = ref(false)
  const startX = ref(0)
  const startWidth = ref(0)

  /** 开始拖拽 */
  function startResize(e: MouseEvent) {
    e.preventDefault()
    isResizing.value = true
    startX.value = e.clientX
    startWidth.value = width.value
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  /** 拖拽过程中 */
  function onMouseMove(e: MouseEvent) {
    if (!isResizing.value)
      return

    const delta = direction === 'right'
      ? e.clientX - startX.value
      : startX.value - e.clientX

    const newWidth = startWidth.value + delta
    width.value = Math.max(minWidth, Math.min(maxWidth, newWidth))
  }

  /** 结束拖拽 */
  function onMouseUp() {
    if (!isResizing.value)
      return

    isResizing.value = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  // 全局监听鼠标事件
  useEventListener(document, 'mousemove', onMouseMove)
  useEventListener(document, 'mouseup', onMouseUp)

  /** 面板样式 */
  const panelStyle = computed<StyleValue>(() => ({
    width: `${width.value}px`,
  }))

  /** 重置为默认宽度 */
  function resetWidth() {
    width.value = defaultWidth
  }

  return {
    width,
    isResizing,
    startResize,
    panelStyle,
    resetWidth,
  }
}
