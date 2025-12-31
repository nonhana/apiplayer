<script lang="ts" setup>
import type { RuntimeParam } from '@/types/proxy'
import { Trash2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

defineProps<{
  params: RuntimeParam[]
  showAdd?: boolean
  editableName?: boolean
  namePlaceholder?: string
  valuePlaceholder?: string
}>()

const emit = defineEmits<{
  (e: 'add'): void
  (e: 'remove', index: number): void
  (e: 'update', index: number, key: keyof RuntimeParam, value: string | boolean): void
}>()
</script>

<template>
  <div class="space-y-2">
    <Table>
      <TableHeader>
        <TableRow class="hover:bg-transparent">
          <TableHead class="w-[50px]">
            启用
          </TableHead>
          <TableHead class="w-[180px]">
            参数名
          </TableHead>
          <TableHead>参数值</TableHead>
          <TableHead v-if="!editableName" class="w-[120px]">
            类型
          </TableHead>
          <TableHead class="w-[50px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow
          v-for="(param, index) in params"
          :key="param.id"
          class="hover:bg-muted/30"
        >
          <TableCell>
            <Checkbox
              :model-value="param.enabled"
              @update:model-value="emit('update', index, 'enabled', $event)"
            />
          </TableCell>

          <TableCell>
            <Input
              :model-value="param.name"
              :placeholder="namePlaceholder ?? '参数名'"
              :disabled="param.fromDefinition && !editableName"
              class="h-8 font-mono text-sm"
              @update:model-value="emit('update', index, 'name', String($event))"
            />
          </TableCell>

          <TableCell>
            <Input
              :model-value="param.value"
              :placeholder="param.description || valuePlaceholder || '参数值'"
              class="h-8 font-mono text-sm"
              @update:model-value="emit('update', index, 'value', String($event))"
            />
          </TableCell>

          <TableCell v-if="!editableName">
            <span class="text-xs text-muted-foreground font-mono">
              {{ param.type ?? 'string' }}
            </span>
          </TableCell>

          <TableCell>
            <Button
              v-if="!param.fromDefinition"
              variant="ghost"
              size="icon"
              class="h-8 w-8 text-muted-foreground hover:text-destructive"
              @click="emit('remove', index)"
            >
              <Trash2 class="h-4 w-4" />
            </Button>
          </TableCell>
        </TableRow>

        <TableRow v-if="params.length === 0">
          <TableCell :colspan="editableName ? 4 : 5" class="text-center text-muted-foreground py-8">
            暂无参数
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>

    <Button
      v-if="showAdd"
      variant="outline"
      size="sm"
      class="w-full"
      @click="emit('add')"
    >
      + 添加参数
    </Button>
  </div>
</template>
