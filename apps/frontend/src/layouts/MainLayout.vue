<script lang="ts" setup>
import Header from '@/components/main/Header.vue'
</script>

<template>
  <div class="h-dvh flex flex-col">
    <Header />
    <div class="flex-1 min-h-0">
      <router-view />
    </div>
  </div>
</template>
