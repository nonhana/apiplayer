<script setup lang="ts">
import type { ScrollAreaScrollbarProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ScrollAreaScrollbar, ScrollAreaThumb } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<ScrollAreaScrollbarProps & {
    class?: HTMLAttributes['class']
    barWidth?: number
  }>(),
  {
    orientation: 'vertical',
    barWidth: 10,
  },
)

const delegatedProps = reactiveOmit(props, 'class')
</script>

<template>
  <ScrollAreaScrollbar
    data-slot="scroll-area-scrollbar"
    v-bind="delegatedProps"
    :class="
      cn('flex touch-none p-px transition-colors select-none',
         orientation === 'vertical'
           && 'h-full border-l border-l-transparent',
         orientation === 'horizontal'
           && 'flex-col border-t border-t-transparent',
         props.class)"
    :style="orientation === 'vertical' ? { width: `${barWidth}px` } : { height: `${barWidth}px` }"
  >
    <ScrollAreaThumb
      data-slot="scroll-area-thumb"
      class="bg-border relative flex-1 rounded-full"
    />
  </ScrollAreaScrollbar>
</template>
