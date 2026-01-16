<script lang="ts" setup>
import { ScrollArea } from '@/components/ui/scroll-area'

defineProps<{
  title: string
  description: string
}>()
</script>

<template>
  <div class="h-full relative flex flex-col gap-6">
    <div class="h-12 flex flex-col justify-between">
      <h3 class="text-lg font-medium">
        {{ title }}
      </h3>
      <p class="text-sm text-muted-foreground">
        {{ description }}
      </p>
    </div>
    <ScrollArea class="h-170">
      <slot />
    </ScrollArea>
    <footer class="absolute bottom-0 right-0">
      <slot name="footer" />
    </footer>
  </div>
</template>
