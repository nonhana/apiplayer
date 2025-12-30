<script lang="ts" setup>
import { Loader2, Play } from 'lucide-vue-next'
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { methodBadgeColors } from '@/constants/api'
import { useApiRunnerStore } from '@/stores/useApiRunnerStore'

const runnerStore = useApiRunnerStore()

/** 当前选中的环境 ID (v-model 用) */
const selectedEnv = computed({
  get: () => runnerStore.selectedEnvId ?? '',
  set: (val: string) => runnerStore.setSelectedEnvId(val || null),
})

/** 请求方法的颜色样式 */
const methodStyle = computed(() => {
  return methodBadgeColors[runnerStore.method] ?? 'bg-gray-500 text-white'
})
</script>

<template>
  <div class="flex items-center gap-3 px-4 py-3 border-b bg-muted/20">
    <!-- 环境选择 -->
    <Select v-model="selectedEnv">
      <SelectTrigger class="w-[160px] h-9">
        <SelectValue placeholder="选择环境" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem
          v-for="env in runnerStore.environments"
          :key="env.id"
          :value="env.id"
        >
          <div class="flex items-center gap-2">
            <span>{{ env.name }}</span>
            <Badge v-if="env.isDefault" variant="secondary" class="text-xs px-1.5 py-0">
              默认
            </Badge>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>

    <!-- 请求方法 + URL 预览 -->
    <div class="flex-1 flex items-center gap-2 min-w-0">
      <Badge :class="methodStyle" class="shrink-0 font-mono text-xs">
        {{ runnerStore.method }}
      </Badge>
      <div class="flex-1 font-mono text-sm text-muted-foreground truncate">
        {{ runnerStore.fullUrl || '请配置请求参数...' }}
      </div>
    </div>

    <!-- 发送按钮 -->
    <Button
      :disabled="runnerStore.isLoading || !runnerStore.selectedEnvId"
      class="shrink-0"
      @click="runnerStore.sendRequest"
    >
      <Loader2 v-if="runnerStore.isLoading" class="h-4 w-4 mr-2 animate-spin" />
      <Play v-else class="h-4 w-4 mr-2" />
      发送请求
    </Button>
  </div>
</template>
