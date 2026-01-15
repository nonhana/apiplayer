<script lang="ts" setup>
defineProps<{
  label: string
}>()
</script>

<template>
  <div class="space-y-3">
    <label class="text-sm font-medium block">{{ label }}</label>
    <slot />
  </div>
</template>
