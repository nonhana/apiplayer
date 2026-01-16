<script lang="ts" setup>
import { ref, watch } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { SETTINGS_MENU_ITEMS } from './constants'

const props = withDefaults(defineProps<{
  initialTab?: string
}>(), {
  initialTab: '',
})

const isOpen = defineModel<boolean>('open', { required: true })

const activeTab = ref(props.initialTab || (SETTINGS_MENU_ITEMS[0]?.value ?? ''))

watch(isOpen, (open) => {
  if (open && props.initialTab) {
    activeTab.value = props.initialTab
  }
})
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-4/5 h-4/5 p-0 gap-0 overflow-hidden">
      <Tabs v-model="activeTab" orientation="vertical" class="flex h-full w-full min-h-0">
        <aside class="w-1/5 border-r border-border bg-muted/30 flex flex-col">
          <DialogHeader class="px-4 py-3 border-b border-border">
            <DialogTitle class="text-base">
              设置
            </DialogTitle>
            <DialogDescription class="sr-only">
              应用偏好设置
            </DialogDescription>
          </DialogHeader>
          <ScrollArea class="flex-1">
            <TabsList class="flex flex-col h-auto w-full bg-transparent p-2 gap-1">
              <TabsTrigger
                v-for="item in SETTINGS_MENU_ITEMS"
                :key="item.value"
                :value="item.value"
                :disabled="item.disabled"
                class="w-full justify-start gap-2 px-3 py-2 text-sm rounded-md data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-none text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
              >
                <component :is="item.icon" class="h-4 w-4" />
                {{ item.label }}
              </TabsTrigger>
            </TabsList>
          </ScrollArea>
        </aside>
        <TabsContent
          v-for="item in SETTINGS_MENU_ITEMS"
          :key="item.value"
          :value="item.value"
          class="flex-1 min-h-0 p-6"
        >
          <component :is="item.component" />
        </TabsContent>
      </Tabs>
    </DialogContent>
  </Dialog>
</template>
