<script lang="ts" setup>
import type { ApiDetail } from '@/types/api'
import { Calendar, Clock, User } from 'lucide-vue-next'
import { computed } from 'vue'
import { Separator } from '@/components/ui/separator'
import dayjs from '@/lib/dayjs'

const props = defineProps<{
  /** API 详情数据 */
  api: ApiDetail
}>()

/** 创建时间（格式化） */
const createdAt = computed(() =>
  dayjs(props.api.createdAt).format('YYYY年MM月DD日 HH:mm'),
)

/** 更新时间（格式化） */
const updatedAt = computed(() =>
  dayjs(props.api.updatedAt).format('YYYY年MM月DD日 HH:mm'),
)

/** 更新时间（相对） */
const updatedAtRelative = computed(() =>
  dayjs(props.api.updatedAt).fromNow(),
)

/** 信息项 */
interface MetaItem {
  icon: typeof Calendar
  label: string
  value: string
  extra?: string
}

const metaItems = computed<MetaItem[]>(() => [
  {
    icon: Calendar,
    label: '创建时间',
    value: createdAt.value,
  },
  {
    icon: Clock,
    label: '更新时间',
    value: updatedAt.value,
    extra: updatedAtRelative.value,
  },
  {
    icon: User,
    label: '创建者',
    value: props.api.creator.name,
  },
  {
    icon: User,
    label: '负责人',
    value: props.api.owner?.name || '未设置',
  },
  {
    icon: User,
    label: '最近编辑',
    value: props.api.editor.name || '未设置',
  },
])
</script>

<template>
  <div class="rounded-lg border bg-card">
    <div class="px-4 py-3 border-b bg-muted/30">
      <h3 class="text-sm font-semibold">
        接口信息
      </h3>
    </div>
    <div class="p-4 space-y-3">
      <template v-for="(item, index) in metaItems" :key="item.label">
        <div class="flex items-start gap-3 text-sm">
          <component
            :is="item.icon"
            class="h-4 w-4 text-muted-foreground mt-0.5 shrink-0"
          />
          <div class="flex-1 min-w-0">
            <div class="text-muted-foreground text-xs mb-0.5">
              {{ item.label }}
            </div>
            <div class="font-medium truncate" :title="item.value">
              {{ item.value }}
            </div>
            <div v-if="item.extra" class="text-xs text-muted-foreground mt-0.5">
              {{ item.extra }}
            </div>
          </div>
        </div>
        <Separator v-if="index < metaItems.length - 1" />
      </template>
    </div>
  </div>
</template>
