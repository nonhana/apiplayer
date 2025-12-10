<script lang="ts" setup>
import type { ApiBrief } from '@/types/api'
import { X } from 'lucide-vue-next'
import { computed, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import ApiSidebar from '@/components/workbench/ApiSidebar.vue'
import WorkbenchHeader from '@/components/workbench/WorkbenchHeader.vue'
import { cn } from '@/lib/utils'
import { useApiTreeStore } from '@/stores/useApiTreeStore'
import { useTabStore } from '@/stores/useTabStore'

const route = useRoute()
const tabStore = useTabStore()
const apiTreeStore = useApiTreeStore()

/** 项目 ID */
const projectId = computed(() => route.params.projectId as string)

/** 当前标签页列表 */
const tabs = computed(() => tabStore.tabs)

/** 当前激活的标签页 ID */
const activeTabId = computed(() => tabStore.activeTabId)

/** 处理 API 选择 */
function handleSelectApi(api: ApiBrief) {
  // 添加到标签页
  tabStore.addTab({
    id: api.id,
    type: 'api',
    title: api.name,
    method: api.method,
    path: api.path,
  })
}

/** 切换标签页 */
function handleTabClick(tabId: string) {
  tabStore.setActiveTab(tabId)
}

/** 关闭标签页 */
function handleTabClose(tabId: string, event: MouseEvent) {
  event.stopPropagation()
  tabStore.removeTab(tabId)
}

/** 获取方法对应的颜色 */
function getMethodColor(method?: string) {
  const colors: Record<string, string> = {
    GET: 'text-emerald-600',
    POST: 'text-amber-600',
    PUT: 'text-blue-600',
    PATCH: 'text-purple-600',
    DELETE: 'text-rose-600',
  }
  return method ? colors[method] ?? 'text-muted-foreground' : ''
}

/** 监听路由变化，更新当前项目 */
watch(projectId, (id) => {
  if (id) {
    apiTreeStore.setProjectId(id)
  }
}, { immediate: true })

/** 组件卸载时重置状态 */
onUnmounted(() => {
  apiTreeStore.reset()
})
</script>

<template>
  <div class="h-screen w-screen overflow-hidden flex flex-col bg-background text-foreground">
    <!-- 头部 -->
    <WorkbenchHeader />

    <div class="flex-1 flex overflow-hidden">
      <!-- 左侧边栏 - API 树 -->
      <ApiSidebar @select-api="handleSelectApi" />

      <!-- 主内容区 -->
      <main class="flex-1 flex flex-col overflow-hidden min-w-0">
        <!-- 标签栏 -->
        <div class="h-9 border-b border-border flex items-center bg-muted/30 overflow-hidden">
          <ScrollArea orientation="horizontal" class="flex-1">
            <div class="flex items-center h-full">
              <div
                v-for="tab in tabs"
                :key="tab.id"
                :class="cn(
                  'group flex items-center gap-1.5 px-3 h-9 border-r border-border cursor-pointer transition-colors',
                  'hover:bg-accent/50',
                  tab.id === activeTabId
                    ? 'bg-background border-b-2 border-b-primary'
                    : 'bg-transparent',
                )"
                @click="handleTabClick(tab.id)"
              >
                <!-- 方法标签 -->
                <span
                  v-if="tab.method"
                  :class="cn('text-[10px] font-bold shrink-0', getMethodColor(tab.method))"
                >
                  {{ tab.method }}
                </span>

                <!-- 标题 -->
                <span class="text-xs truncate max-w-[120px]">
                  {{ tab.title }}
                </span>

                <!-- 脏标记 -->
                <span
                  v-if="tab.dirty"
                  class="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"
                />

                <!-- 关闭按钮 -->
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                  @click="(e: MouseEvent) => handleTabClose(tab.id, e)"
                >
                  <X class="h-3 w-3" />
                </Button>
              </div>
            </div>
          </ScrollArea>
        </div>

        <!-- 内容区域 -->
        <div class="flex-1 overflow-auto relative">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
