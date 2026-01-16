<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Toaster } from '@/components/ui/sonner'
import { useGlobalStore } from '@/stores/useGlobalStore'
import EmptyLayout from './layouts/EmptyLayout.vue'
import MainLayout from './layouts/MainLayout.vue'
import 'vue-sonner/style.css'

const layouts = {
  main: MainLayout,
  empty: EmptyLayout,
}

const route = useRoute()

const Layout = computed(() => layouts[(route.meta.layout as keyof typeof layouts) ?? 'main'])

const globalStore = useGlobalStore()
const { initSystemConfig } = globalStore

onMounted(() => {
  initSystemConfig()
})
</script>

<template>
  <Layout>
    <router-view />
  </Layout>
  <Toaster />
</template>
