<script setup lang="ts">
// Login View
</script>

<template>
  <div class="space-y-4">
    <div class="bg-card p-6 rounded-lg border border-border shadow-sm">
      <h2 class="text-xl font-semibold mb-4">
        Login
      </h2>
      <p class="text-muted-foreground mb-4">
        Enter your credentials to access your account.
      </p>
      <!-- Form placeholder -->
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">Email</label>
          <input type="email" class="w-full p-2 rounded border bg-background">
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Password</label>
          <input type="password" class="w-full p-2 rounded border bg-background">
        </div>
        <button class="w-full py-2 bg-primary text-primary-foreground rounded">
          Sign In
        </button>
      </div>
    </div>
  </div>
</template>
