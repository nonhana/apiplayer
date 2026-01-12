<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { watch } from 'vue'
import { Toaster } from '@/components/ui/sonner'
import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import 'vue-sonner/style.css'

const globalStore = useGlobalStore()
const { initRoles } = globalStore

const userStore = useUserStore()
const { isAuthenticated } = storeToRefs(userStore)

watch(isAuthenticated, (newV) => {
  if (newV) {
    initRoles()
  }
})
</script>

<template>
  <router-view />
  <Toaster />
</template>
