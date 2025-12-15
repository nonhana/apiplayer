<script lang="ts" setup>
import type { ApiParam, ParamType } from '@/types/api'
import { GripVertical, Plus, Trash2 } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { PARAM_TYPES } from '@/constants/api'
import { cn } from '@/lib/utils'

/** 内部使用的参数项（带唯一 key） */
interface ParamItem extends ApiParam {
  _key: string
}

const props = withDefaults(defineProps<{
  /** 参数列表 */
  params: ApiParam[]
  /** 是否显示类型列 */
  showType?: boolean
  /** 是否显示必填列 */
  showRequired?: boolean
  /** 是否显示默认值列 */
  showDefault?: boolean
  /** 是否显示示例列 */
  showExample?: boolean
  /** 是否显示描述列 */
  showDescription?: boolean
  /** 空状态提示文案 */
  emptyText?: string
  /** 新增按钮文案 */
  addButtonText?: string
  /** 是否可拖拽排序 */
  draggable?: boolean
  /** 是否禁用 */
  disabled?: boolean
}>(), {
  showType: true,
  showRequired: true,
  showDefault: true,
  showExample: true,
  showDescription: true,
  emptyText: '暂无参数，点击添加',
  addButtonText: '添加参数',
  draggable: false,
  disabled: false,
})

const emit = defineEmits<{
  /** 参数变化 */
  (e: 'update:params', params: ApiParam[]): void
}>()

/** 生成唯一 key */
function generateKey() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/** 内部参数列表（带 _key） */
const internalParams = ref<ParamItem[]>([])

/** 同步外部参数到内部 */
watch(
  () => props.params,
  (newParams) => {
    // 只在外部数据真正变化时同步
    const needsSync = newParams.length !== internalParams.value.length
      || newParams.some((p, i) => {
        const internal = internalParams.value[i]
        return !internal || p.name !== internal.name
      })

    if (needsSync) {
      internalParams.value = newParams.map(p => ({
        ...p,
        _key: generateKey(),
      }))
    }
  },
  { immediate: true, deep: true },
)

/** 参数类型颜色 */
const typeColors: Record<ParamType, string> = {
  string: 'text-emerald-600',
  number: 'text-blue-600',
  integer: 'text-blue-600',
  boolean: 'text-purple-600',
  array: 'text-amber-600',
  object: 'text-rose-600',
  file: 'text-cyan-600',
}

/** 表格列数 */
const columnCount = computed(() => {
  let count = 2 // 拖拽手柄 + 参数名
  if (props.showType)
    count++
  if (props.showRequired)
    count++
  if (props.showDefault)
    count++
  if (props.showExample)
    count++
  if (props.showDescription)
    count++
  count++ // 操作列
  return count
})

/** 通知外部参数变化 */
function emitChange() {
  const params = internalParams.value.map(({ _key, ...rest }) => rest)
  emit('update:params', params)
}

/** 添加参数 */
function handleAdd() {
  if (props.disabled)
    return

  internalParams.value.push({
    _key: generateKey(),
    name: '',
    type: 'string',
    required: false,
    description: '',
    defaultValue: '',
    example: '',
  })
  emitChange()
}

/** 删除参数 */
function handleRemove(index: number) {
  if (props.disabled)
    return

  internalParams.value.splice(index, 1)
  emitChange()
}

/** 更新参数字段 */
function handleUpdate<K extends keyof ApiParam>(index: number, key: K, value: ApiParam[K]) {
  if (props.disabled)
    return

  const param = internalParams.value[index]
  if (param) {
    (param as ApiParam)[key] = value
    emitChange()
  }
}
</script>

<template>
  <div class="space-y-3">
    <!-- 参数表格 -->
    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow class="bg-muted/50">
            <TableHead v-if="draggable" class="w-[40px]" />
            <TableHead class="w-[160px] font-semibold">
              参数名
            </TableHead>
            <TableHead v-if="showType" class="w-[100px] font-semibold">
              类型
            </TableHead>
            <TableHead v-if="showRequired" class="w-[60px] font-semibold text-center">
              必填
            </TableHead>
            <TableHead v-if="showDefault" class="w-[120px] font-semibold">
              默认值
            </TableHead>
            <TableHead v-if="showExample" class="w-[120px] font-semibold">
              示例值
            </TableHead>
            <TableHead v-if="showDescription" class="font-semibold">
              说明
            </TableHead>
            <TableHead class="w-[60px] font-semibold text-center">
              操作
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="internalParams.length > 0">
            <TableRow
              v-for="(param, index) in internalParams"
              :key="param._key"
              class="group"
            >
              <!-- 拖拽手柄 -->
              <TableCell v-if="draggable" class="w-[40px] px-2">
                <GripVertical
                  class="h-4 w-4 text-muted-foreground cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </TableCell>

              <!-- 参数名 -->
              <TableCell>
                <Input
                  :model-value="param.name"
                  placeholder="参数名"
                  :disabled="disabled"
                  class="h-8 font-mono text-sm"
                  @update:model-value="handleUpdate(index, 'name', String($event))"
                />
              </TableCell>

              <!-- 类型 -->
              <TableCell v-if="showType">
                <Select
                  :model-value="param.type"
                  :disabled="disabled"
                  @update:model-value="handleUpdate(index, 'type', $event as ParamType)"
                >
                  <SelectTrigger class="h-8 text-xs">
                    <SelectValue placeholder="类型">
                      <span :class="cn('font-mono', typeColors[param.type])">
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
                      <span :class="cn('font-mono', typeColors[type])">
                        {{ type }}
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>

              <!-- 必填 -->
              <TableCell v-if="showRequired" class="text-center">
                <div class="flex justify-center">
                  <Checkbox
                    :checked="param.required ?? false"
                    :disabled="disabled"
                    @update:checked="handleUpdate(index, 'required', $event)"
                  />
                </div>
              </TableCell>

              <!-- 默认值 -->
              <TableCell v-if="showDefault">
                <Input
                  :model-value="param.defaultValue ?? ''"
                  placeholder="-"
                  :disabled="disabled"
                  class="h-8 text-xs font-mono"
                  @update:model-value="handleUpdate(index, 'defaultValue', String($event))"
                />
              </TableCell>

              <!-- 示例值 -->
              <TableCell v-if="showExample">
                <Input
                  :model-value="param.example ?? ''"
                  placeholder="-"
                  :disabled="disabled"
                  class="h-8 text-xs font-mono"
                  @update:model-value="handleUpdate(index, 'example', String($event))"
                />
              </TableCell>

              <!-- 说明 -->
              <TableCell v-if="showDescription">
                <Input
                  :model-value="param.description ?? ''"
                  placeholder="参数说明"
                  :disabled="disabled"
                  class="h-8 text-sm"
                  @update:model-value="handleUpdate(index, 'description', String($event))"
                />
              </TableCell>

              <!-- 操作 -->
              <TableCell class="text-center">
                <Button
                  variant="ghost"
                  size="icon"
                  :disabled="disabled"
                  class="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  @click="handleRemove(index)"
                >
                  <Trash2 class="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          </template>

          <!-- 空状态 -->
          <TableRow v-else>
            <TableCell
              :colspan="columnCount"
              class="text-center text-muted-foreground py-8"
            >
              {{ emptyText }}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- 添加按钮 -->
    <Button
      variant="outline"
      size="sm"
      :disabled="disabled"
      class="w-full border-dashed"
      @click="handleAdd"
    >
      <Plus class="h-4 w-4 mr-1.5" />
      {{ addButtonText }}
    </Button>
  </div>
</template>
