<script lang="ts" setup>
import type { ApiParam } from '@/types/api'
import { AlertCircle } from 'lucide-vue-next'
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

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
  /** 空状态文案 */
  emptyText?: string
}>(), {
  showType: true,
  showRequired: true,
  showDefault: true,
  showExample: true,
  emptyText: '暂无参数',
})

/** 是否有参数 */
const hasParams = computed(() => props.params.length > 0)

/** 参数类型颜色 */
const typeColors: Record<string, string> = {
  string: 'text-emerald-600',
  number: 'text-blue-600',
  integer: 'text-blue-600',
  boolean: 'text-purple-600',
  array: 'text-amber-600',
  object: 'text-rose-600',
  file: 'text-cyan-600',
}

/** 获取类型颜色 */
function getTypeColor(type: string): string {
  return typeColors[type] ?? 'text-muted-foreground'
}

/** 格式化约束信息 */
function formatConstraints(param: ApiParam): string[] {
  const constraints: string[] = []

  if (param.minLength !== undefined) {
    constraints.push(`最小长度: ${param.minLength}`)
  }
  if (param.maxLength !== undefined) {
    constraints.push(`最大长度: ${param.maxLength}`)
  }
  if (param.format) {
    constraints.push(`格式: ${param.format}`)
  }
  if (param.enum && param.enum.length > 0) {
    constraints.push(`枚举: ${param.enum.join(', ')}`)
  }

  return constraints
}
</script>

<template>
  <div class="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow class="bg-muted/50">
          <TableHead class="w-[180px] text-center">
            参数名
          </TableHead>
          <TableHead v-if="showType" class="w-[100px] text-center">
            类型
          </TableHead>
          <TableHead v-if="showRequired" class="w-[100px] text-center">
            必填
          </TableHead>
          <TableHead v-if="showDefault" class="w-[160px] text-center">
            默认值
          </TableHead>
          <TableHead v-if="showExample" class="w-[160px] text-center">
            示例
          </TableHead>
          <TableHead class="text-center">
            说明
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <template v-if="hasParams">
          <TableRow
            v-for="param in params"
            :key="param.name"
            class="group"
          >
            <TableCell class="font-mono text-sm">
              <div class="flex-center gap-1.5">
                <span class="font-medium">{{ param.name }}</span>
                <TooltipProvider v-if="formatConstraints(param).length > 0">
                  <Tooltip>
                    <TooltipTrigger>
                      <AlertCircle class="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent side="right" class="max-w-xs">
                      <ul class="text-xs space-y-0.5">
                        <li v-for="c in formatConstraints(param)" :key="c">
                          {{ c }}
                        </li>
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </TableCell>
            <TableCell v-if="showType" class="text-center">
              <span :class="cn('font-mono text-xs', getTypeColor(param.type))">
                {{ param.type }}
              </span>
            </TableCell>
            <TableCell v-if="showRequired" class="text-center">
              <Badge
                v-if="param.required"
                variant="destructive"
                class="text-[10px] px-1.5"
              >
                必填
              </Badge>
              <span v-else class="text-muted-foreground text-xs">可选</span>
            </TableCell>
            <TableCell v-if="showDefault" class="text-center">
              <code
                v-if="param.defaultValue !== undefined"
                class="text-xs bg-muted px-1.5 py-0.5 rounded font-mono"
              >
                {{ param.defaultValue }}
              </code>
              <span v-else class="text-muted-foreground text-xs">-</span>
            </TableCell>
            <TableCell v-if="showExample" class="text-center">
              <code
                v-if="param.example"
                class="text-xs bg-muted px-1.5 py-0.5 rounded font-mono"
              >
                {{ param.example }}
              </code>
              <span v-else class="text-muted-foreground text-xs">-</span>
            </TableCell>
            <TableCell class="text-center">
              <span class="text-sm text-muted-foreground">
                {{ param.description ?? '-' }}
              </span>
            </TableCell>
          </TableRow>
        </template>
        <TableRow v-else>
          <TableCell
            :colspan="1 + (showType ? 1 : 0) + (showRequired ? 1 : 0) + (showDefault ? 1 : 0) + (showExample ? 1 : 0) + 1"
            class="text-center text-muted-foreground py-8"
          >
            {{ emptyText }}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
