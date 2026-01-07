<script lang="ts" setup>
import { Check, Copy } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { useApiRunnerStore } from '@/stores/useApiRunnerStore'

const runnerStore = useApiRunnerStore()
const { curlCommand } = storeToRefs(runnerStore)

const copied = ref(false)

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(curlCommand.value)
    copied.value = true
    toast.success('已复制到剪贴板')

    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
  catch (error) {
    console.error('复制失败', error)
    toast.error('复制失败')
  }
}
</script>

<template>
  <ScrollArea class="h-full">
    <div class="p-4 space-y-3">
      <div class="flex items-center justify-between">
        <p class="text-sm text-muted-foreground">
          根据当前配置生成的 cURL 命令
        </p>
        <Button
          variant="outline"
          size="sm"
          class="gap-1.5"
          @click="copyToClipboard"
        >
          <Check v-if="copied" class="h-4 w-4 text-emerald-500" />
          <Copy v-else class="h-4 w-4" />
          {{ copied ? '已复制' : '复制' }}
        </Button>
      </div>

      <Textarea
        v-model="curlCommand"
        readonly
        class="font-mono text-sm min-h-[200px] resize-none bg-muted/30"
      />
    </div>
  </ScrollArea>
</template>
