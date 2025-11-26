<script setup lang="ts">
// Dashboard Layout for Project List, Team Management
</script>

<template>
  <div class="min-h-screen bg-background text-foreground flex flex-col">
    <!-- Top Navigation -->
    <header class="h-14 border-b border-border flex items-center px-6 sticky top-0 bg-background/95 backdrop-blur z-50">
      <div class="flex items-center gap-4">
        <span class="font-bold text-lg">ApiPlayer</span>
      </div>
      <div class="ml-auto flex items-center gap-4">
        <!-- User Menu Placeholder -->
        <div class="w-8 h-8 rounded-full bg-secondary" />
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 container mx-auto py-6 px-4">
      <slot />
    </main>
  </div>
</template>
