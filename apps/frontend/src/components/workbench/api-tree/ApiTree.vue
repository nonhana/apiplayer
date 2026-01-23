<script lang="ts" setup>
import type { ApiBrief, GroupNodeWithApis } from '@/types/api'
import type { DropItem } from '@/types/api-drag'
import {
  FolderPlus,
  FolderRoot,
  Inbox,
  Loader2,
} from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
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

const apiTreeStore = useApiTreeStore()
const { projectId, loadingStatus, filteredTree, hasTree } = storeToRefs(apiTreeStore)

const isLoading = computed(() => loadingStatus.value === 'loading')
const hasData = computed(() => filteredTree.value.length > 0)

const apiDragStore = useApiDragStore()
const { isDragging } = storeToRefs(apiDragStore)

const dragger = useApiTreeDrag(apiDragStore, apiTreeStore)

const searchInput = ref('')

// 工具栏创建 API 时先进行分组校验
function handleToolbarCreateApi() {
  if (!hasTree.value) {
    toast.error('接口必须归属于某个分组，请先创建分组')
    emits('createGroup')
    return
  }
  emits('createApi')
}

/** 是否正在拖拽到 Root 区域 */
const isRootDragOver = ref(false)

watch(searchInput, (newV) => {
  apiTreeStore.setSearchQuery(newV)
})

watch(projectId, (newV) => {
  if (newV) {
    apiTreeStore.fetchTree(newV)
  }
}, { immediate: true })

/** 根级别区域拖拽经过 */
function handleRootDragOver(e: DragEvent) {
  e.preventDefault()

  if (!dragger.canMoveToRoot.value)
    return

  e.dataTransfer!.dropEffect = 'move'
  const target: DropItem = { type: 'root' }

  if (dragger.isValidDrop(target)) {
    isRootDragOver.value = true
    apiDragStore.setDropTarget(target)
  }
}

function handleRootDragLeave() {
  isRootDragOver.value = false
}

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
      @create-api="handleToolbarCreateApi"
      @create-group="emits('createGroup')"
    />

    <ScrollArea class="flex-1 px-2">
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
            @click="emits('createGroup')"
          >
            <FolderPlus class="h-4 w-4 mr-1" />
            新建分组
          </Button>
        </div>
      </div>

      <div v-else class="py-2">
        <ApiTreeGroup
          v-for="group in filteredTree"
          :key="group.id"
          :group="group"
          :level="0"
          @create-group="emits('createGroup', $event)"
          @create-api="emits('createApi', $event)"
          @rename-group="emits('renameGroup', $event)"
          @delete-group="emits('deleteGroup', $event)"
          @select-api="emits('selectApi', $event)"
          @clone-api="emits('cloneApi', $event)"
          @delete-api="emits('deleteApi', $event)"
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
            v-if="isDragging && dragger.canMoveToRoot"
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
