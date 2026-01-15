<script lang="ts" setup>
defineProps<{
  title: string
  description: string
}>()
</script>

<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-medium mb-1">
        {{ title }}
      </h3>
      <p class="text-sm text-muted-foreground">
        {{ description }}
      </p>
    </div>
    <slot />
  </div>
</template>
