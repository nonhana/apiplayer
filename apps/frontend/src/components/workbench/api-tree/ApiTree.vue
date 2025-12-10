<script lang="ts" setup>
import type { ApiBrief, GroupNodeWithApis } from '@/types/api'
import {
  ChevronDown,
  ChevronRight,
  FilePlus,
  FolderPlus,
  Inbox,
  Loader2,
  RefreshCw,
  Search,
} from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useApiTreeStore } from '@/stores/useApiTreeStore'
import ApiTreeGroup from './ApiTreeGroup.vue'

const emits = defineEmits<{
  (e: 'selectApi', api: ApiBrief): void
  (e: 'createGroup', parentId?: string): void
  (e: 'createApi', groupId?: string): void
  (e: 'renameGroup', group: GroupNodeWithApis): void
  (e: 'deleteGroup', group: GroupNodeWithApis): void
  (e: 'cloneApi', api: ApiBrief): void
  (e: 'deleteApi', api: ApiBrief): void
}>()

const route = useRoute()
const apiTreeStore = useApiTreeStore()

/** 本地搜索输入 */
const searchInput = ref('')

/** 项目 ID */
const projectId = computed(() => route.params.projectId as string)

/** 是否加载中 */
const isLoading = computed(() => apiTreeStore.isLoading)

/** 过滤后的树数据 */
const treeData = computed(() => apiTreeStore.filteredTree)

/** 是否有数据 */
const hasData = computed(() => treeData.value.length > 0)

/** 监听搜索输入变化 */
watch(searchInput, (val) => {
  apiTreeStore.setSearchQuery(val)
})

/** 监听路由变化，加载树数据 */
watch(projectId, (id) => {
  if (id) {
    apiTreeStore.fetchTree(id)
  }
}, { immediate: true })

/** 刷新树 */
async function handleRefresh() {
  await apiTreeStore.refreshTree()
}

/** 全部展开 */
function handleExpandAll() {
  apiTreeStore.expandAll()
}

/** 全部折叠 */
function handleCollapseAll() {
  apiTreeStore.collapseAll()
}

/** 新建根分组 */
function handleCreateRootGroup() {
  emits('createGroup', undefined)
}

/** 新建分组（在指定父分组下） */
function handleCreateGroup(parentId: string) {
  emits('createGroup', parentId)
}

/** 新建 API */
function handleCreateApi(groupId?: string) {
  emits('createApi', groupId)
}

/** 重命名分组 */
function handleRenameGroup(group: GroupNodeWithApis) {
  emits('renameGroup', group)
}

/** 删除分组 */
function handleDeleteGroup(group: GroupNodeWithApis) {
  emits('deleteGroup', group)
}

/** 选择 API */
function handleSelectApi(api: ApiBrief) {
  emits('selectApi', api)
}

/** 克隆 API */
function handleCloneApi(api: ApiBrief) {
  emits('cloneApi', api)
}

/** 删除 API */
function handleDeleteApi(api: ApiBrief) {
  emits('deleteApi', api)
}

onMounted(() => {
  if (projectId.value) {
    apiTreeStore.fetchTree(projectId.value)
  }
})
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- 搜索栏和工具栏 -->
    <div class="p-2 space-y-2 border-b border-border">
      <!-- 搜索输入框 -->
      <div class="relative">
        <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          v-model="searchInput"
          placeholder="搜索接口..."
          class="h-8 pl-8 text-sm"
        />
      </div>

      <!-- 工具栏 -->
      <div class="flex items-center gap-1">
        <TooltipProvider :delay-duration="300">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="h-7 w-7"
                :disabled="isLoading"
                @click="handleRefresh"
              >
                <RefreshCw
                  class="h-3.5 w-3.5" :class="[isLoading && 'animate-spin']"
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              刷新
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider :delay-duration="300">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="h-7 w-7"
                @click="handleExpandAll"
              >
                <ChevronDown class="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              全部展开
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider :delay-duration="300">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="h-7 w-7"
                @click="handleCollapseAll"
              >
                <ChevronRight class="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              全部折叠
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div class="flex-1" />

        <TooltipProvider :delay-duration="300">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="h-7 w-7"
                @click="handleCreateRootGroup"
              >
                <FolderPlus class="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              新建分组
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider :delay-duration="300">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="h-7 w-7"
                @click="handleCreateApi()"
              >
                <FilePlus class="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              新建接口
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>

    <!-- 树形结构 -->
    <ScrollArea class="flex-1">
      <!-- 加载中 -->
      <div
        v-if="isLoading && !hasData"
        class="flex items-center justify-center py-12"
      >
        <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
      </div>

      <!-- 空状态 -->
      <div
        v-else-if="!hasData"
        class="flex flex-col items-center justify-center py-12 px-4"
      >
        <div class="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <Inbox class="h-6 w-6 text-muted-foreground" />
        </div>
        <p class="text-sm text-muted-foreground text-center mb-4">
          {{ searchInput ? '没有找到匹配的接口' : '暂无接口，点击上方按钮创建' }}
        </p>
        <div
          v-if="!searchInput"
          class="flex gap-2"
        >
          <Button
            variant="outline"
            size="sm"
            @click="handleCreateRootGroup"
          >
            <FolderPlus class="h-4 w-4 mr-1" />
            新建分组
          </Button>
        </div>
      </div>

      <!-- 树内容 -->
      <div v-else class="py-1">
        <ApiTreeGroup
          v-for="group in treeData"
          :key="group.id"
          :group="group"
          :level="0"
          @create-group="handleCreateGroup"
          @create-api="handleCreateApi"
          @rename-group="handleRenameGroup"
          @delete-group="handleDeleteGroup"
          @select-api="handleSelectApi"
          @clone-api="handleCloneApi"
          @delete-api="handleDeleteApi"
        />
      </div>
    </ScrollArea>
  </div>
</template>
