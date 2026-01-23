<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useApiRunnerStore } from '@/stores/useApiRunnerStore'

const runnerStore = useApiRunnerStore()
const { response } = storeToRefs(runnerStore)

const headersList = computed(() => {
  const headers = response.value?.headers ?? {}
  return Object.entries(headers).map(([key, value]) => ({ key, value }))
})
</script>

<template>
  <ScrollArea class="h-full">
    <Table class="table-fixed w-full">
      <TableHeader>
        <TableRow class="hover:bg-transparent">
          <TableHead class="w-60">
            Header
          </TableHead>
          <TableHead>Value</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow
          v-for="header in headersList"
          :key="header.key"
          class="hover:bg-muted/30"
        >
          <TableCell class="font-mono text-sm font-medium">
            {{ header.key }}
          </TableCell>
          <TableCell class="font-mono text-sm text-muted-foreground break-all whitespace-normal">
            {{ header.value }}
          </TableCell>
        </TableRow>

        <TableRow v-if="headersList.length === 0">
          <TableCell colspan="2" class="text-center text-muted-foreground py-8">
            暂无响应头
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </ScrollArea>
</template>
