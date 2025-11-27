<template>
  <div class="min-h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 p-4">
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-1/2 -left-1/2 w-full h-full bg-linear-to-br from-primary/20 to-transparent blur-3xl opacity-50 transform rotate-12" />
      <div class="absolute -bottom-1/2 -right-1/2 w-full h-full bg-linear-to-tl from-blue-500/20 to-transparent blur-3xl opacity-50 transform -rotate-12" />
    </div>
    <div class="w-full max-w-md relative z-10">
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold tracking-tight text-primary">
          ApiPlayer
        </h1>
        <p class="text-muted-foreground mt-2">
          您的现代化 API 管理平台
        </p>
      </div>
      <router-view />
    </div>
  </div>
</template>
