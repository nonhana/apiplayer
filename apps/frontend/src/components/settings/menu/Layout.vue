<script lang="ts" setup>
import { ScrollArea } from '@/components/ui/scroll-area'

defineProps<{
  title: string
  description: string
}>()
</script>

<template>
  <div class="h-full min-h-0 flex flex-col gap-6">
    <header class="space-y-2">
      <h3 class="text-lg font-medium">
        {{ title }}
      </h3>
      <p class="text-sm text-muted-foreground">
        {{ description }}
      </p>
    </header>
    <ScrollArea class="flex-1 min-h-0">
      <div class="space-y-6 p-3">
        <slot />
      </div>
    </ScrollArea>
    <footer v-if="$slots.footer">
      <slot name="footer" />
    </footer>
  </div>
</template>
