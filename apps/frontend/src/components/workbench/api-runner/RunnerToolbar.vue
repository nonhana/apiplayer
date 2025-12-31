<script lang="ts" setup>
import { Loader2, Play } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { methodBadgeColors } from '@/constants/api'
import { useApiRunnerStore } from '@/stores/useApiRunnerStore'

const runnerStore = useApiRunnerStore()
const { selectedEnvId, method, fullUrl, isLoading } = storeToRefs(runnerStore)
const { sendRequest } = runnerStore

/** 请求方法的颜色样式 */
const methodStyle = computed(() => {
  return methodBadgeColors[method.value] ?? 'bg-gray-500 text-white'
})
</script>

<template>
  <div class="flex items-center gap-3 px-4 py-3 border-b bg-muted/20">
    <div class="flex-1 flex items-center gap-2 min-w-0">
      <Badge :class="methodStyle" class="shrink-0 font-mono text-xs">
        {{ method }}
      </Badge>
      <div class="flex-1 font-mono text-sm text-muted-foreground truncate">
        {{ fullUrl || '请配置请求参数...' }}
      </div>
    </div>

    <Button
      :disabled="isLoading || !selectedEnvId"
      class="shrink-0"
      @click="sendRequest"
    >
      <Loader2 v-if="isLoading" class="h-4 w-4 mr-2 animate-spin" />
      <Play v-else class="h-4 w-4 mr-2" />
      发送请求
    </Button>
  </div>
</template>
