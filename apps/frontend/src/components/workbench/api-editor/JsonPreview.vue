<script lang="ts" setup>
import { Check, Copy } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { highlightCode } from '@/lib/highlighter'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  /** JSON 数据 */
  data: unknown
  /** 是否显示复制按钮 */
  showCopy?: boolean
  /** 自定义类名 */
  class?: string
}>(), {
  showCopy: true,
})

/** 格式化后的 JSON 字符串 */
const formattedJson = computed(() => {
  if (props.data === undefined || props.data === null) {
    return ''
  }
  try {
    return JSON.stringify(props.data, null, 2)
  }
  catch {
    return String(props.data)
  }
})

/** 是否有内容 */
const hasContent = computed(() => formattedJson.value.length > 0)

/** 是否刚刚复制 */
const justCopied = ref(false)

/** 复制到剪贴板 */
async function handleCopy() {
  if (!hasContent.value)
    return

  try {
    await navigator.clipboard.writeText(formattedJson.value)
    justCopied.value = true
    setTimeout(() => {
      justCopied.value = false
    }, 2000)
  }
  catch (err) {
    console.error('复制失败:', err)
  }
}

const html = ref('')

async function highlight() {
  html.value = await highlightCode(formattedJson.value, 'json')
}

watch(formattedJson, () => {
  highlight()
}, { immediate: true })
</script>

<template>
  <div
    :class="cn(
      'relative rounded-md border bg-muted/30 font-mono text-sm',
      props.class,
    )"
  >
    <!-- 复制按钮 -->
    <Button
      v-if="showCopy && hasContent"
      variant="ghost"
      size="icon"
      class="absolute top-2 right-2 h-7 w-7 z-10"
      :class="{ 'opacity-100': justCopied }"
      @click="handleCopy"
    >
      <Check v-if="justCopied" class="h-3.5 w-3.5 text-emerald-600" />
      <Copy v-else class="h-3.5 w-3.5" />
    </Button>

    <!-- JSON 内容 -->
    <ScrollArea class="p-4">
      <div v-if="hasContent" v-html="html" />
      <div v-else class="text-muted-foreground text-center py-4">
        暂无数据
      </div>
    </ScrollArea>
  </div>
</template>
