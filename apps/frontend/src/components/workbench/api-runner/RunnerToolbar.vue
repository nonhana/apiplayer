<script lang="ts" setup>
import { Loader2, Play } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { methodBadgeColors } from '@/constants/api'
import { useApiRunnerStore } from '@/stores/useApiRunnerStore'
import { useProjectStore } from '@/stores/useProjectStore'

const runnerStore = useApiRunnerStore()
const { method, fullUrl, isLoading } = storeToRefs(runnerStore)
const { sendRequest } = runnerStore

const projectStore = useProjectStore()
const { curEnvId } = storeToRefs(projectStore)
</script>

<template>
  <div class="flex items-center gap-3 px-4 py-3 border-b bg-muted/20">
    <div class="flex-1 flex items-center gap-2 min-w-0">
      <Badge :class="methodBadgeColors[method]" class="shrink-0 font-mono text-xs">
        {{ method }}
      </Badge>
      <div class="flex-1 font-mono text-sm text-muted-foreground truncate">
        {{ fullUrl || '请配置请求参数...' }}
      </div>
    </div>

    <Button
      :disabled="isLoading || !curEnvId"
      class="shrink-0"
      @click="sendRequest"
    >
      <Loader2 v-if="isLoading" class="h-4 w-4 animate-spin" />
      <Play v-else class="h-4 w-4" />
      发送请求
    </Button>
  </div>
</template>
