<script lang="ts" setup>
import type { ApiBrief, GroupNodeWithApis } from '@/types/api'
import {
  FolderPlus,
  FolderRoot,
  Inbox,
  Loader2,
} from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useApiTreeDrag } from '@/composables/useApiTreeDrag'
import { cn } from '@/lib/utils'
import { useApiDragStore } from '@/stores/useApiDragStore'
import { useApiTreeStore } from '@/stores/useApiTreeStore'
import ApiTreeGroup from './ApiTreeGroup.vue'
import ApiTreeToolbar from './ApiTreeToolbar.vue'

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
const apiDragStore = useApiDragStore()
const dragger = useApiTreeDrag(apiDragStore, apiTreeStore)

/** 本地搜索输入 */
const searchInput = ref('')

/** 是否正在拖拽 */
const isDragging = computed(() => apiDragStore.isDragging)

/** 是否可以移动到根级别 */
const showRootDropZone = computed(() => dragger.canMoveToRoot())

/** 是否正在拖拽到根级别区域 */
const isRootDragOver = ref(false)

/** 项目 ID */
const projectId = computed(() => route.params.projectId as string)

/** 是否加载中 */
const isLoading = computed(() => apiTreeStore.loadingStatus === 'loading')

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

/** 新建根分组 */
function handleCreateRootGroup() {
  emits('createGroup')
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

/** 根级别区域拖拽经过 */
function handleRootDragOver(e: DragEvent) {
  e.preventDefault()

  if (!showRootDropZone.value)
    return

  e.dataTransfer!.dropEffect = 'move'
  const target = { type: 'root' as const }

  if (dragger.isValidDrop(target)) {
    isRootDragOver.value = true
    apiDragStore.setDropTarget(target)
  }
}

/** 根级别区域拖拽离开 */
function handleRootDragLeave() {
  isRootDragOver.value = false
}

/** 根级别区域放置 */
async function handleRootDrop(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()

  if (isRootDragOver.value) {
    await dragger.executeDrop()
  }

  isRootDragOver.value = false
}

onMounted(() => {
  if (projectId.value) {
    apiTreeStore.fetchTree(projectId.value)
  }
})
</script>

<template>
  <div class="h-full flex flex-col">
    <ApiTreeToolbar
      @create-api="emits('createApi')"
      @create-group="emits('createGroup')"
    />

    <ScrollArea class="flex-1">
      <div
        v-if="isLoading && !hasData"
        class="flex items-center justify-center py-12"
      >
        <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
      </div>

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

        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          leave-active-class="transition-all duration-150 ease-in"
          enter-from-class="opacity-0 max-h-0"
          enter-to-class="opacity-100 max-h-20"
          leave-from-class="opacity-100 max-h-20"
          leave-to-class="opacity-0 max-h-0"
        >
          <div
            v-if="isDragging && showRootDropZone"
            :class="cn(
              'mx-2 mt-2 px-3 py-3 rounded-lg border-2 border-dashed transition-all duration-150',
              'flex items-center justify-center gap-2 text-sm',
              isRootDragOver
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-muted-foreground/30 text-muted-foreground',
            )"
            @dragover="handleRootDragOver"
            @dragleave="handleRootDragLeave"
            @drop="handleRootDrop"
          >
            <FolderRoot
              :class="cn(
                'h-4 w-4 transition-transform duration-150',
                isRootDragOver && 'scale-110',
              )"
            />
            <span>移动到根目录</span>
          </div>
        </Transition>
      </div>
    </ScrollArea>
  </div>
</template>
