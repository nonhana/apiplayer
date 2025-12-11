<script lang="ts" setup>
import {
  ChevronsDownUp,
  ChevronsUpDown,
  FilePlus,
  FolderPlus,
  RefreshCw,
  Search,
} from 'lucide-vue-next'
import { ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useApiTreeStore } from '@/stores/useApiTreeStore'

const emits = defineEmits<{
  (e: 'createGroup'): void
  (e: 'createApi'): void
}>()

const apiTreeStore = useApiTreeStore()

/** 本地搜索输入 */
const searchInput = ref('')

/** 监听搜索输入变化 */
watch(searchInput, (val) => {
  apiTreeStore.setSearchQuery(val)
})
</script>

<template>
  <div class="p-2 space-y-2 border-b border-border">
    <div class="relative">
      <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      <Input
        v-model="searchInput"
        placeholder="搜索接口..."
        class="h-8 pl-8 text-sm"
      />
    </div>

    <div class="flex items-center gap-1">
      <TooltipProvider :delay-duration="300">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="h-7 w-7"
              :disabled="apiTreeStore.isLoading"
              @click="apiTreeStore.refreshTree()"
            >
              <RefreshCw class="h-3.5 w-3.5" :class="[apiTreeStore.isLoading && 'animate-spin']" />
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
              @click="apiTreeStore.expandAll()"
            >
              <ChevronsUpDown class="h-3.5 w-3.5" />
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
              @click="apiTreeStore.collapseAll()"
            >
              <ChevronsDownUp class="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            全部折叠
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <!-- space between -->
      <div class="flex-1" />

      <TooltipProvider :delay-duration="300">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="h-7 w-7"
              @click="emits('createGroup')"
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
              @click="emits('createApi')"
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
</template>
