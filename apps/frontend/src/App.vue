<script setup lang="ts">
import { onMounted } from 'vue'
import { Toaster } from '@/components/ui/sonner'
import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import 'vue-sonner/style.css'

const globalStore = useGlobalStore()
const userStore = useUserStore()

// App init
onMounted(() => {
  if (userStore.isAuthenticated) {
    globalStore.initRoles()
  }
})
</script>

<template>
  <router-view />
  <Toaster />
</template>
