<script lang="ts" setup>
import type { Tab } from '@/types/api'
import { X } from 'lucide-vue-next'
import Button from '@/components/ui/button/Button.vue'
import { methodColors } from '@/constants/api'
import { cn } from '@/lib/utils'
import { useTabStore } from '@/stores/useTabStore'

defineProps<{
  tab: Tab
}>()

const tabStore = useTabStore()
</script>

<template>
  <div
    :class="cn(
      'group flex items-center gap-1.5 px-3 h-9 border-r border-border cursor-pointer transition-colors',
      'hover:bg-accent/50',
      tab.id === tabStore.activeTabId
        ? 'bg-background border-b-2 border-b-primary'
        : 'bg-transparent',
    )"
    @click="tabStore.setActiveTab(tab.id)"
  >
    <span
      v-if="tab.method"
      :class="cn('text-[10px] font-bold shrink-0', methodColors[tab.method])"
    >
      {{ tab.method }}
    </span>

    <span class="text-xs truncate max-w-[120px]">
      {{ tab.title }}
    </span>

    <span
      v-if="tab.dirty"
      class="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"
    />

    <Button
      variant="ghost"
      size="icon"
      class="h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
      @click="tabStore.removeTab(tab.id)"
    >
      <X class="h-3 w-3" />
    </Button>
  </div>
</template>
