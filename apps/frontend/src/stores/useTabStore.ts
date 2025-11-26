import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Tab {
  id: string
  title: string
  type: 'api' | 'overview' | 'settings' | 'schema'
  path?: string // Route path or internal identifier
  isDirty?: boolean
  data?: any
}

export const useTabStore = defineStore('tab', () => {
  const tabs = ref<Tab[]>([])
  const activeTabId = ref<string>('')

  function addTab(tab: Tab) {
    const existing = tabs.value.find(t => t.id === tab.id)
    if (!existing) {
      tabs.value.push(tab)
    }
    activeTabId.value = tab.id
  }

  function closeTab(id: string) {
    const index = tabs.value.findIndex(t => t.id === id)
    if (index === -1)
      return

    tabs.value.splice(index, 1)

    // If closed active tab, switch to another
    if (activeTabId.value === id) {
      if (tabs.value.length > 0) {
        // Switch to the one to the left, or the first one
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

  function setActiveTab(id: string) {
    activeTabId.value = id
  }

  return {
    tabs,
    activeTabId,
    addTab,
    closeTab,
    setActiveTab,
  }
}, {
  persist: {
    storage: sessionStorage, // Tabs usually shouldn't persist across hard reloads unless we restore state fully
  },
})
