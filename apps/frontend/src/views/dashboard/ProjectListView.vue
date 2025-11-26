<script setup lang="ts">
// Project List View
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">
        Projects
      </h1>
      <button class="bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium">
        + New Project
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- Project Card Placeholder -->
      <div class="p-4 rounded-lg border border-border bg-card hover:shadow transition-shadow cursor-pointer">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
            A
          </div>
          <div>
            <h3 class="font-semibold">
              ApiPlayer Core
            </h3>
            <p class="text-xs text-muted-foreground">
              Updated 2h ago
            </p>
          </div>
        </div>
        <p class="text-sm text-muted-foreground line-clamp-2">
          Main backend repository for the ApiPlayer platform.
        </p>
      </div>
    </div>
  </div>
</template>
