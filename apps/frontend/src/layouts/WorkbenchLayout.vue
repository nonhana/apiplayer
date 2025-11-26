<script setup lang="ts">
// Workbench Layout for API Editor
</script>

<template>
  <div class="h-screen w-screen overflow-hidden flex flex-col bg-background text-foreground">
    <!-- Header (Condensed) -->
    <header class="h-12 border-b border-border flex items-center px-4 bg-background shrink-0">
      <div class="flex items-center gap-4">
        <span class="font-bold">Project Name</span>
        <span class="text-muted-foreground">/</span>
        <span>Environment</span>
      </div>
    </header>

    <div class="flex-1 flex overflow-hidden">
      <!-- Sidebar -->
      <aside class="w-64 border-r border-border flex flex-col shrink-0">
        <div class="p-2 border-b border-border">
          <input type="text" placeholder="Filter..." class="w-full px-2 py-1 text-sm border rounded bg-muted">
        </div>
        <div class="flex-1 overflow-auto p-2">
          <!-- API Tree Placeholder -->
          <div class="text-sm text-muted-foreground">
            API Tree
          </div>
        </div>
      </aside>

      <!-- Main Editor Area -->
      <main class="flex-1 flex flex-col overflow-hidden min-w-0">
        <!-- Tabs Bar -->
        <div class="h-9 border-b border-border flex items-center bg-muted/30 overflow-x-auto">
          <!-- Tabs Placeholder -->
          <div class="px-3 py-1 text-xs border-r border-border bg-background h-full flex items-center">
            New Request
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-auto p-4 relative">
          <slot />
        </div>
      </main>

      <!-- Right Panel (Optional) -->
      <!-- <aside class="w-80 border-l border-border bg-muted/10"></aside> -->
    </div>
  </div>
</template>
