<script setup lang="ts">
import type { ScrollAreaRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import {
  ScrollAreaCorner,
  ScrollAreaRoot,
  ScrollAreaViewport,
} from 'reka-ui'
import { cn } from '@/lib/utils'
import ScrollBar from './ScrollBar.vue'

interface Props extends ScrollAreaRootProps {
  class?: HTMLAttributes['class']
  orientation?: 'vertical' | 'horizontal' | 'both'
  barWidth?: number
}

const props = withDefaults(defineProps<Props>(), {
  orientation: 'vertical',
  barWidth: 10,
})

const delegatedProps = reactiveOmit(props, 'class', 'orientation')
</script>

<template>
  <ScrollAreaRoot
    data-slot="scroll-area"
    v-bind="delegatedProps"
    :class="cn('relative', props.class)"
  >
    <ScrollAreaViewport
      data-slot="scroll-area-viewport"
      class="focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1"
    >
      <slot />
    </ScrollAreaViewport>
    <ScrollBar v-if="orientation === 'vertical' || orientation === 'both'" orientation="vertical" :bar-width="barWidth" />
    <ScrollBar v-if="orientation === 'horizontal' || orientation === 'both'" orientation="horizontal" :bar-width="barWidth" />
    <ScrollAreaCorner />
  </ScrollAreaRoot>
</template>
