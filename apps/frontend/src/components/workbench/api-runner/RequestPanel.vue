<script lang="ts" setup>
import type { TabPageItem } from '@/types'
import { FileText, Key, Link, Settings } from 'lucide-vue-next'
import { ref } from 'vue'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AuthTab from './request/AuthTab.vue'
import BodyTab from './request/BodyTab.vue'
import HeadersTab from './request/HeadersTab.vue'
import ParamsTab from './request/ParamsTab.vue'

type TabType = 'params' | 'headers' | 'body' | 'auth'
const tabItems: TabPageItem<TabType>[] = [
  { value: 'params', label: 'Params', icon: Link },
  { value: 'headers', label: 'Headers', icon: Settings },
  { value: 'body', label: 'Body', icon: FileText },
  { value: 'auth', label: 'Auth', icon: Key },
]

const activeTab = ref<TabType>('params')
</script>

<template>
  <div class="flex flex-col h-full border rounded-lg bg-card">
    <div class="px-4 py-2 border-b bg-muted/20">
      <h3 class="text-sm font-medium">
        请求配置
      </h3>
    </div>

    <Tabs v-model="activeTab" class="flex-1 flex flex-col overflow-hidden">
      <TabsList class="bg-transparent m-2">
        <TabsTrigger
          v-for="tab in tabItems"
          :key="tab.value"
          :value="tab.value"
          class="gap-1.5 px-3 data-[state=active]:text-primary"
        >
          <component :is="tab.icon" class="h-4 w-4" />
          {{ tab.label }}
        </TabsTrigger>
      </TabsList>

      <ScrollArea class="flex-1">
        <TabsContent value="params" class="mt-0">
          <ParamsTab />
        </TabsContent>

        <TabsContent value="headers" class="mt-0">
          <HeadersTab />
        </TabsContent>

        <TabsContent value="body" class="mt-0">
          <BodyTab />
        </TabsContent>

        <TabsContent value="auth" class="mt-0">
          <AuthTab />
        </TabsContent>
      </ScrollArea>
    </Tabs>
  </div>
</template>
