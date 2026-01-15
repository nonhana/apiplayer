<script lang="ts" setup>
defineProps<{
  title: string
  description: string
}>()
</script>

<template>
  <div class="space-y-6">
    <div class="h-12 flex flex-col justify-between">
      <h3 class="text-lg font-medium">
        {{ title }}
      </h3>
      <p class="text-sm text-muted-foreground">
        {{ description }}
      </p>
    </div>
    <div class="h-170 overflow-y-auto">
      <slot />
    </div>
  </div>
</template>
