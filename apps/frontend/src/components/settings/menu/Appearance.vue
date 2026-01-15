<script lang="ts" setup>
import { useColorMode } from '@vueuse/core'
import { Monitor, Moon, Sun } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import Item from './Item.vue'
import Layout from './Layout.vue'

const colorMode = useColorMode()

const appearanceModes = [
  { value: 'light', label: '浅色', icon: Sun },
  { value: 'dark', label: '深色', icon: Moon },
  { value: 'auto', label: '跟随系统', icon: Monitor },
] as const
</script>

<template>
  <Layout title="外观" description="自定义应用的外观和主题">
    <Item label="主题模式">
      <div class="grid grid-cols-3 gap-3">
        <button
          v-for="mode in appearanceModes"
          :key="mode.value"
          :class="cn(
            'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
            colorMode === mode.value
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-accent/50',
          )"
          @click="colorMode = mode.value"
        >
          <component
            :is="mode.icon"
            :class="cn(
              'h-6 w-6',
              colorMode === mode.value ? 'text-primary' : 'text-muted-foreground',
            )"
          />
          <span
            :class="cn(
              'text-sm',
              colorMode === mode.value ? 'font-medium text-primary' : 'text-muted-foreground',
            )"
          >
            {{ mode.label }}
          </span>
        </button>
      </div>
    </Item>
  </Layout>
</template>
