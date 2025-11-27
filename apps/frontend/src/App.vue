<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Toaster } from '@/components/ui/sonner'
import Header from './components/Header.vue'
import { PUBLIC_ROUTES } from './constants'

import 'vue-sonner/style.css'

const route = useRoute()
const hideHeader = computed(() => PUBLIC_ROUTES.includes(route.name as string))
</script>

<template>
  <Header v-if="!hideHeader" />
  <router-view />
  <Toaster />
</template>
