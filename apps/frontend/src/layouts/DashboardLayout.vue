<script lang="ts" setup>
import DashboardHeader from '@/components/dashboard/DashboardHeader.vue'
</script>

<template>
  <div class="h-dvh w-screen overflow-hidden flex flex-col bg-background text-foreground">
    <DashboardHeader />
    <main class="container mx-auto py-6 px-4">
      <router-view />
    </main>
  </div>
</template>
