<script lang="ts" setup>
import type { SupportedHighlightLang } from '@/lib/highlighter'
import { Check, Copy } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { highlightCode } from '@/lib/highlighter'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  code: string
  lang?: SupportedHighlightLang
  showHeader?: boolean
  showCopy?: boolean
  title?: string
  maxHeight?: number
}>(), {
  lang: 'json',
  showHeader: true,
  showCopy: true,
})

const langNameMap: Record<SupportedHighlightLang, string>
  = {
    json: 'JSON',
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    html: 'HTML',
    css: 'CSS',
    shell: 'Shell',
    plaintext: 'Plaintext',
  }

const html = ref('')
const justCopied = ref(false)

const langLabel = computed(() => langNameMap[props.lang] ?? props.lang.toUpperCase())

async function handleCopy() {
  if (!props.code)
    return

  try {
    await navigator.clipboard.writeText(props.code)
    justCopied.value = true
    setTimeout(() => justCopied.value = false, 2000)
  }
  catch (error) {
    console.error('复制失败:', error)
  }
}

watch(() => props.code, async () => {
  if (!props.code) {
    html.value = ''
    return
  }
  html.value = await highlightCode(props.code, props.lang)
}, { immediate: true })
</script>

<template>
  <div
    class="rounded-lg border bg-muted/30 font-mono text-sm overflow-auto"
    :style="{ maxHeight: `${maxHeight}px` }"
  >
    <div
      v-if="showHeader"
      class="flex items-center px-4 py-2 border-b bg-muted/50 gap-2"
    >
      <span v-if="title" class="text-xs font-medium text-muted-foreground select-none flex-1">
        {{ title }}
      </span>

      <span :class="cn('text-xs font-medium text-muted-foreground select-none', !title && 'flex-1')">
        {{ langLabel }}
      </span>

      <TooltipProvider v-if="showCopy && code">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="h-6 w-6"
              @click="handleCopy"
            >
              <Check v-if="justCopied" class="h-3.5 w-3.5 text-emerald-500" />
              <Copy v-else class="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            {{ justCopied ? '已复制！' : '复制代码' }}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>

    <ScrollArea>
      <div
        v-if="html"
        class="p-4"
        v-html="html"
      />
      <div
        v-else
        class="p-4 text-muted-foreground text-center"
      >
        暂无内容
      </div>
    </ScrollArea>
  </div>
</template>
