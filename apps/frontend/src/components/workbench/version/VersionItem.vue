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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  versionChangeTypeColors,
  versionChangeTypeLabels,
  versionStatusDotColors,
  versionStatusLabels,
} from '@/constants/version'
import dayjs from '@/lib/dayjs'
import { cn } from '@/lib/utils'

const props = defineProps<{
  /** 版本信息 */
  version: ApiVersionBrief
  /** 是否为当前选中版本 */
  isSelected?: boolean
  /** 是否为当前 API 的活跃版本 */
  isCurrent?: boolean
  /** 是否显示比较按钮 */
  showCompare?: boolean
}>()

const emits = defineEmits<{
  (e: 'view'): void
  (e: 'compare'): void
  (e: 'publish'): void
  (e: 'archive'): void
  (e: 'rollback'): void
}>()

/** 格式化时间 */
const formattedTime = computed(() => dayjs(props.version.createdAt).format('YYYY-MM-DD HH:mm'))

/** 相对时间 */
const relativeTime = computed(() => dayjs(props.version.createdAt).fromNow())

/** 发布时间 */
const publishedTime = computed(() =>
  props.version.publishedAt
    ? dayjs(props.version.publishedAt).format('YYYY-MM-DD HH:mm')
    : null,
)

/** 状态点颜色 */
const statusDotColor = computed(() => versionStatusDotColors[props.version.status])

/** 是否可以发布 */
const canPublish = computed(() => props.version.status === 'DRAFT')

/** 是否可以归档 */
const canArchive = computed(() => props.version.status !== 'ARCHIVED')

/** 是否可以回滚 */
const canRollback = computed(() => props.version.status === 'ARCHIVED')

/** 显示的变更标签（最多3个） */
const displayChanges = computed(() => props.version.changes.slice(0, 3))

/** 是否有更多变更 */
const hasMoreChanges = computed(() => props.version.changes.length > 3)
</script>

<template>
  <div
    :class="cn(
      'group relative flex gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
      'hover:bg-muted/50',
      isSelected && 'bg-primary/5 border-primary/30',
      isCurrent && 'ring-1 ring-primary/20',
    )"
    @click="emits('view')"
  >
    <!-- 左侧时间线指示器 -->
    <div class="flex flex-col items-center shrink-0 pt-0.5">
      <div
        :class="cn(
          'h-3 w-3 rounded-full shrink-0',
          statusDotColor,
        )"
      />
      <div class="flex-1 w-px bg-border mt-2" />
    </div>

    <!-- 主体内容 -->
    <div class="flex-1 min-w-0 space-y-2">
      <!-- 版本号 + 状态 -->
      <div class="flex items-center gap-2">
        <span class="font-mono font-semibold text-sm">
          v{{ version.version }}
        </span>
        <Badge
          variant="outline"
          class="text-xs px-1.5 py-0"
        >
          {{ versionStatusLabels[version.status] }}
        </Badge>
        <span
          v-if="isCurrent"
          class="text-xs text-primary font-medium flex items-center gap-1"
        >
          <CheckCircle2 class="h-3 w-3" />
          当前
        </span>
      </div>

      <!-- 摘要 -->
      <p
        v-if="version.summary"
        class="text-sm text-muted-foreground line-clamp-2"
      >
        {{ version.summary }}
      </p>

      <!-- 变更标签 -->
      <div
        v-if="displayChanges.length > 0"
        class="flex flex-wrap gap-1"
      >
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

      <!-- 时间信息 -->
      <div class="flex items-center gap-3 text-xs text-muted-foreground">
        <TooltipProvider :delay-duration="300">
          <Tooltip>
            <TooltipTrigger class="flex items-center gap-1">
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
      </div>
    </div>

    <!-- 右侧操作按钮 -->
    <div
      class="flex items-start gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
      @click.stop
    >
      <!-- 比较按钮 -->
      <TooltipProvider v-if="showCompare" :delay-duration="300">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="h-7 w-7"
              @click="emits('compare')"
            >
              <GitCompare class="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>选择比较</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <!-- 更多操作 -->
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button
            variant="ghost"
            size="icon"
            class="h-7 w-7"
          >
            <MoreHorizontal class="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-40">
          <DropdownMenuItem @click="emits('view')">
            <Eye class="h-4 w-4 mr-2" />
            查看详情
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            v-if="canPublish"
            @click="emits('publish')"
          >
            <Rocket class="h-4 w-4 mr-2" />
            发布版本
          </DropdownMenuItem>

          <DropdownMenuItem
            v-if="canArchive"
            @click="emits('archive')"
          >
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
  </div>
</template>
