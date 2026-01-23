<script setup lang="ts">
import type { TabsRootEmits, TabsRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { TabsRoot, useForwardPropsEmits } from 'reka-ui'
import { cn } from '@/lib/utils'

type TabsProps = TabsRootProps & { class?: HTMLAttributes['class'] }

const props = withDefaults(defineProps<TabsProps>(), {
  orientation: 'vertical',
})
const emits = defineEmits<TabsRootEmits>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <TabsRoot
    v-slot="slotProps"
    data-slot="tabs"
    v-bind="forwarded"
    :class="cn('flex', orientation === 'vertical' ? 'flex-col' : 'flex-row', props.class)"
  >
    <slot v-bind="slotProps" />
  </TabsRoot>
</template>
