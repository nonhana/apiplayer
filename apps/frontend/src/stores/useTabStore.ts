import type { HttpMethod, Tab, TabType } from '@/types/api'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

/** 创建标签页的参数 */
export interface CreateTabParams {
  id: string
  title: string
  type: TabType
  method?: HttpMethod
  path?: string
  data?: unknown
  pinned?: boolean
}

export const useTabStore = defineStore('tab', () => {
  /** 标签页列表 */
  const tabs = ref<Tab[]>([])

  /** 当前激活的标签页 ID */
  const activeTabId = ref<string>('')

  /** 当前激活的标签页 */
  const activeTab = computed(() =>
    tabs.value.find(t => t.id === activeTabId.value) ?? null,
  )

  /** 是否有标签页 */
  const hasTabs = computed(() => tabs.value.length > 0)

  /** 添加标签页 */
  function addTab(params: CreateTabParams) {
    const hasTab = tabs.value.some(t => t.id === params.id)

    if (!hasTab) {
      // immutable
      tabs.value = [
        ...tabs.value,
        {
          id: params.id,
          title: params.title,
          type: params.type,
          method: params.method,
          path: params.path,
          dirty: false,
          pinned: params.pinned ?? false,
          data: params.data,
        },
      ]
    }

    activeTabId.value = params.id
  }

  /** 关闭标签页 */
  function removeTab(id: string) {
    const index = tabs.value.findIndex(t => t.id === id)
    if (index === -1)
      return

    // immutable
    tabs.value = tabs.value.filter(t => t.id !== id)

    // 如果关闭的是当前激活的标签页，切换到相邻的标签
    if (activeTabId.value === id) {
      if (tabs.value.length > 0) {
        const nextTab = tabs.value[Math.max(0, index - 1)]
        if (nextTab) {
          activeTabId.value = nextTab.id
        }
      }
      else {
        activeTabId.value = ''
      }
    }
  }

  /** 关闭所有标签页 */
  function removeAllTabs() {
    tabs.value = []
    activeTabId.value = ''
  }

  /** 关闭其他标签页 */
  function removeOtherTabs(id: string) {
    const target = tabs.value.find(t => t.id === id)
    if (target) {
      tabs.value = [target]
      activeTabId.value = id
    }
  }

  /** 关闭右侧标签页 */
  function removeRightTabs(id: string) {
    const index = tabs.value.findIndex(t => t.id === id)
    if (index !== -1) {
      tabs.value = tabs.value.slice(0, index + 1)
      // 如果激活的标签被关闭了，切换到当前标签
      if (!tabs.value.find(t => t.id === activeTabId.value)) {
        activeTabId.value = id
      }
    }
  }

  /** 关闭左侧标签页 */
  function removeLeftTabs(id: string) {
    const index = tabs.value.findIndex(t => t.id === id)
    if (index !== -1) {
      tabs.value = tabs.value.slice(index)
      // 如果激活的标签被关闭了，切换到当前标签
      if (!tabs.value.find(t => t.id === activeTabId.value)) {
        activeTabId.value = id
      }
    }
  }

  /** 关闭已保存的标签页（没有未保存修改的） */
  function removeSavedTabs() {
    const dirtyTabs = tabs.value.filter(t => t.dirty)
    tabs.value = dirtyTabs
    // 如果当前激活的标签被关了，切换到第一个
    if (!tabs.value.find(t => t.id === activeTabId.value)) {
      activeTabId.value = tabs.value[0]?.id ?? ''
    }
  }

  /** 固定/取消固定标签页 */
  function togglePinTab(id: string) {
    const tab = tabs.value.find(t => t.id === id)
    if (tab) {
      tab.pinned = !tab.pinned
      // 固定的标签移动到前面
      if (tab.pinned) {
        const index = tabs.value.indexOf(tab)
        const pinnedCount = tabs.value.filter(t => t.pinned && t.id !== id).length
        if (index > pinnedCount) {
          tabs.value.splice(index, 1)
          tabs.value.splice(pinnedCount, 0, tab)
        }
      }
    }
  }

  /** 移动标签页到指定位置 */
  function moveTab(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex)
      return
    if (fromIndex < 0 || fromIndex >= tabs.value.length)
      return
    if (toIndex < 0 || toIndex >= tabs.value.length)
      return

    const tab = tabs.value.splice(fromIndex, 1)[0]!
    tabs.value.splice(toIndex, 0, tab)
  }

  /** 设置激活的标签页 */
  function setActiveTab(id: string) {
    activeTabId.value = id
  }

  /** 更新标签页标题 */
  function updateTabTitle(id: string, title: string) {
    const tab = tabs.value.find(t => t.id === id)
    if (tab) {
      tab.title = title
    }
  }

  /** 标记标签页为脏（有未保存修改） */
  function setTabDirty(id: string, dirty: boolean) {
    const tab = tabs.value.find(t => t.id === id)
    if (tab) {
      tab.dirty = dirty
    }
  }

  /** 更新标签页数据 */
  function updateTabData(id: string, data: unknown) {
    const tab = tabs.value.find(t => t.id === id)
    if (tab) {
      tab.data = data
    }
  }

  /** 检查标签页是否存在 */
  function hasTab(id: string): boolean {
    return tabs.value.some(t => t.id === id)
  }

  /** 获取标签页 */
  function getTab(id: string): Tab | undefined {
    return tabs.value.find(t => t.id === id)
  }

  /** 重置状态 */
  function reset() {
    tabs.value = []
    activeTabId.value = ''
  }

  return {
    // 状态
    tabs,
    activeTabId,

    // 计算属性
    activeTab,
    hasTabs,

    // 方法
    addTab,
    removeTab,
    removeAllTabs,
    removeOtherTabs,
    removeRightTabs,
    removeLeftTabs,
    removeSavedTabs,
    togglePinTab,
    moveTab,
    setActiveTab,
    updateTabTitle,
    setTabDirty,
    updateTabData,
    hasTab,
    getTab,
    reset,
  }
}, {
  persist: {
    storage: sessionStorage,
  },
})
