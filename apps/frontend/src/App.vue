<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Toaster } from '@/components/ui/sonner'
import Header from './components/Header.vue'
import { PUBLIC_ROUTES } from './constants'

import 'vue-sonner/style.css'

const route = useRoute()
const hideHeader = ref(false)

watch(() => route.name, (name) => {
  if (PUBLIC_ROUTES.includes(name as string)) {
    hideHeader.value = true
  }
  else {
    hideHeader.value = false
  }
})
</script>

<template>
  <Header v-if="!hideHeader" />
  <router-view />
  <Toaster />
</template>
