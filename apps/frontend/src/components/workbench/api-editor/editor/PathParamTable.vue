<script lang="ts" setup>
import type { ApiParam, ParamType } from '@/types/api'
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PARAM_TYPES, paramTypeColors } from '@/constants/api'
import { cn } from '@/lib/utils'
import ParamTableValueForm from './ParamTableValueForm.vue'

const props = withDefaults(defineProps<{
  /** 参数列表 */
  params: ApiParam[]
  /** 是否禁用编辑 */
  disabled?: boolean
  /** 空状态提示文案 */
  emptyText?: string
}>(), {
  disabled: false,
  emptyText: '暂无路径参数',
})

const emit = defineEmits<{
  (e: 'update:params', params: ApiParam[]): void
}>()

/** 内部参数列表 */
const internalParams = computed(() => props.params)

/** 更新参数字段（不含 name） */
function handleUpdate<K extends Exclude<keyof ApiParam, 'name'>>(
  index: number,
  key: K,
  value: ApiParam[K],
) {
  if (props.disabled)
    return

  const newParams = [...props.params]
  const param = newParams[index]
  if (param) {
    newParams[index] = { ...param, [key]: value }
    emit('update:params', newParams)
  }
}
</script>

<template>
  <div class="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow class="bg-muted/50">
          <TableHead class="w-[160px]">
            参数名
          </TableHead>
          <TableHead class="w-[100px]">
            类型
          </TableHead>
          <TableHead class="w-[60px] text-center">
            必填
          </TableHead>
          <TableHead class="w-[180px]">
            示例值
          </TableHead>
          <TableHead>
            说明
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <template v-if="internalParams.length > 0">
          <TableRow
            v-for="(param, index) in internalParams"
            :key="param.name"
            class="group"
          >
            <TableCell>
              <div class="flex items-center gap-2">
                <code class="px-2 py-1 bg-muted rounded text-sm font-mono text-foreground">
                  {{ param.name }}
                </code>
              </div>
            </TableCell>

            <TableCell>
              <Select
                :model-value="param.type"
                :disabled="disabled"
                @update:model-value="handleUpdate(index, 'type', $event as ParamType)"
              >
                <SelectTrigger class="h-8 text-xs">
                  <SelectValue placeholder="类型">
                    <span :class="cn('font-mono', paramTypeColors[param.type])">
                      {{ param.type }}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="type in PARAM_TYPES"
                    :key="type"
                    :value="type"
                  >
                    <span :class="cn('font-mono', paramTypeColors[type])">
                      {{ type }}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </TableCell>

            <TableCell class="text-center">
              <Badge variant="destructive" class="text-[10px] px-1.5">
                必填
              </Badge>
            </TableCell>

            <TableCell>
              <ParamTableValueForm
                :type="param.type"
                :model-value="param.example ?? ''"
                :disabled="disabled"
                @update:model-value="handleUpdate(index, 'example', $event)"
              />
            </TableCell>

            <TableCell>
              <Input
                :model-value="param.description ?? ''"
                placeholder="参数说明"
                :disabled="disabled"
                class="h-8 text-sm"
                @update:model-value="handleUpdate(index, 'description', String($event))"
              />
            </TableCell>
          </TableRow>
        </template>

        <TableRow v-else>
          <TableCell
            :colspan="5"
            class="text-center text-muted-foreground py-8"
          >
            {{ emptyText }}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
