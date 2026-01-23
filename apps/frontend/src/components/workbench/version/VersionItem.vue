<script lang="ts" setup>
import type { ApiVersionBrief } from '@/types/version'
import {
  Archive,
  CheckCircle2,
  Clock,
  Eye,
  GitCompare,
  MoreHorizontal,
  Rocket,
  RotateCcw,
} from 'lucide-vue-next'
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TableCell, TableRow } from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  versionChangeTypeColors,
  versionChangeTypeLabels,
  versionStatusColors,
  versionStatusLabels,
} from '@/constants/version'
import dayjs from '@/lib/dayjs'
import { cn } from '@/lib/utils'

const props = defineProps<{
  version: ApiVersionBrief
  isSelected?: boolean
  isCurrent?: boolean
  showCompare?: boolean
  isComparing?: boolean
  canPublish?: boolean
}>()

const emits = defineEmits<{
  (e: 'view'): void
  (e: 'compare'): void
  (e: 'publish'): void
  (e: 'archive'): void
  (e: 'rollback'): void
}>()

const formattedTime = computed(() => dayjs(props.version.createdAt).format('YYYY-MM-DD HH:mm'))
const relativeTime = computed(() => dayjs(props.version.createdAt).fromNow())
const publishedTime = computed(() =>
  props.version.publishedAt
    ? dayjs(props.version.publishedAt).format('YYYY-MM-DD HH:mm')
    : null,
)

const versionLabel = computed(() => props.version.version ?? `#${props.version.revision}`)
const showPublishBtn = computed(() => props.version.status === 'DRAFT' && props.canPublish)
const canArchive = computed(() => props.version.status !== 'ARCHIVED')
const canRollback = computed(() => props.version.status === 'ARCHIVED')

/** 最多显示 3 个变更类型标签 */
const displayChanges = computed(() => props.version.changes.slice(0, 3))
const hasMoreChanges = computed(() => props.version.changes.length > 3)
</script>

<template>
  <TableRow
    :class="cn(
      'cursor-pointer',
      isSelected && 'bg-primary/5',
      isCurrent && 'bg-primary/5',
    )"
    @click="emits('view')"
  >
    <!-- 版本号列 -->
    <TableCell class="w-[100px]">
      <div class="flex items-center gap-1.5">
        <span class="font-mono font-semibold text-sm">{{ versionLabel }}</span>
        <CheckCircle2
          v-if="isCurrent"
          class="h-3.5 w-3.5 text-primary shrink-0"
        />
      </div>
    </TableCell>

    <!-- 状态列 -->
    <TableCell class="w-[90px]">
      <Badge
        variant="outline"
        :class="cn('text-xs px-1.5 py-0', versionStatusColors[version.status])"
      >
        {{ versionStatusLabels[version.status] }}
      </Badge>
    </TableCell>

    <!-- 变更类型列 -->
    <TableCell class="w-[200px]">
      <div v-if="displayChanges.length > 0" class="flex flex-wrap gap-1">
        <Badge
          v-for="change in displayChanges"
          :key="change"
          variant="outline"
          :class="cn('text-xs px-1.5 py-0', versionChangeTypeColors[change])"
        >
          {{ versionChangeTypeLabels[change] }}
        </Badge>
        <span
          v-if="hasMoreChanges"
          class="text-xs text-muted-foreground"
        >
          +{{ version.changes.length - 3 }}
        </span>
      </div>
      <span v-else class="text-xs text-muted-foreground">-</span>
    </TableCell>

    <!-- 摘要列 -->
    <TableCell class="min-w-[120px]">
      <span
        v-if="version.summary"
        class="text-sm text-muted-foreground line-clamp-1"
      >
        {{ version.summary }}
      </span>
      <span v-else class="text-xs text-muted-foreground">-</span>
    </TableCell>

    <!-- 时间列 -->
    <TableCell class="w-[100px]">
      <TooltipProvider :delay-duration="300">
        <Tooltip>
          <TooltipTrigger class="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock class="h-3 w-3" />
            {{ relativeTime }}
          </TooltipTrigger>
          <TooltipContent>
            <p>创建时间: {{ formattedTime }}</p>
            <p v-if="publishedTime">
              发布时间: {{ publishedTime }}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </TableCell>

    <!-- 操作列 -->
    <TableCell class="w-[80px]" @click.stop>
      <div class="flex items-center gap-0.5">
        <TooltipProvider v-if="showCompare" :delay-duration="300">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="h-7 w-7"
                @click="emits('compare')"
              >
                <GitCompare
                  class="h-3.5 w-3.5"
                  :class="isComparing ? 'text-primary' : ''"
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>选择比较</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon" class="h-7 w-7">
              <MoreHorizontal class="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-40">
            <DropdownMenuItem @click="emits('view')">
              <Eye class="h-4 w-4 mr-2" />
              查看详情
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem v-if="showPublishBtn" @click="emits('publish')">
              <Rocket class="h-4 w-4 mr-2" />
              发布版本
            </DropdownMenuItem>

            <DropdownMenuItem v-if="canArchive" @click="emits('archive')">
              <Archive class="h-4 w-4 mr-2" />
              归档版本
            </DropdownMenuItem>

            <DropdownMenuItem
              v-if="canRollback"
              class="text-amber-600 focus:text-amber-600"
              @click="emits('rollback')"
            >
              <RotateCcw class="h-4 w-4 mr-2" />
              回滚到此版本
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TableCell>
  </TableRow>
</template>
