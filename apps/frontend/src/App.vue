<script setup lang="ts">
import { onMounted } from 'vue'
import { Toaster } from '@/components/ui/sonner'
import { useGlobalStore } from '@/stores/useGlobalStore'
import 'vue-sonner/style.css'

const globalStore = useGlobalStore()

// App init
onMounted(() => {
  globalStore.initProjectRoles()
})
</script>

<template>
  <router-view />
  <Toaster />
</template>
