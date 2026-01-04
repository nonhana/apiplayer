<script lang="ts" setup>
import type { ApiVersionBrief } from '@/types/version'
import { AlertTriangle, RotateCcw } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { versionStatusColors, versionStatusLabels } from '@/constants/version'
import dayjs from '@/lib/dayjs'
import { cn } from '@/lib/utils'

const props = defineProps<{
  /** 要回滚到的目标版本 */
  version: ApiVersionBrief | null
}>()

const emits = defineEmits<{
  (e: 'confirm'): void
}>()

const isOpen = defineModel<boolean>('open', { required: true })

/** 是否确认理解风险 */
const isConfirmed = ref(false)

/** 是否可以提交 */
const canSubmit = computed(() => isConfirmed.value && props.version)

/** 格式化时间 */
const versionTime = computed(() => {
  if (!props.version)
    return ''
  return dayjs(props.version.createdAt).format('YYYY-MM-DD HH:mm')
})

/** 监听对话框打开，重置确认状态 */
watch(isOpen, (open) => {
  if (open) {
    isConfirmed.value = false
  }
})
</script>

<template>
  <AlertDialog v-model:open="isOpen">
    <AlertDialogContent class="max-w-md">
      <AlertDialogHeader>
        <AlertDialogTitle class="flex items-center gap-2">
          <AlertTriangle class="h-5 w-5 text-amber-500" />
          确认回滚版本
        </AlertDialogTitle>
        <AlertDialogDescription as="div" class="space-y-4">
          <p>
            您确定要将 API 回滚到以下版本吗？此操作将创建一个新的版本，并将当前版本归档。
          </p>

          <!-- 目标版本信息 -->
          <div
            v-if="version"
            class="p-4 rounded-lg border bg-muted/50 space-y-2"
          >
            <div class="flex items-center gap-2">
              <span class="font-mono font-semibold text-foreground">
                v{{ version.version }}
              </span>
              <Badge
                variant="outline"
                :class="cn('text-xs', versionStatusColors[version.status])"
              >
                {{ versionStatusLabels[version.status] }}
              </Badge>
            </div>
            <p
              v-if="version.summary"
              class="text-sm"
            >
              {{ version.summary }}
            </p>
            <p class="text-xs text-muted-foreground">
              创建于 {{ versionTime }}
            </p>
          </div>

          <!-- 警告信息 -->
          <div class="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <div class="flex items-start gap-2">
              <AlertTriangle class="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div class="text-sm text-amber-800 dark:text-amber-200">
                <p class="font-medium">
                  请注意：
                </p>
                <ul class="list-disc list-inside mt-1 space-y-1 text-amber-700 dark:text-amber-300">
                  <li>回滚操作会基于目标版本创建新版本</li>
                  <li>当前版本将被归档但不会删除</li>
                  <li>API 的所有字段将恢复到目标版本的状态</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- 确认复选框 -->
          <div class="flex items-center gap-2">
            <Checkbox
              id="confirm-rollback"
              v-model:checked="isConfirmed"
            />
            <Label
              for="confirm-rollback"
              class="text-sm font-normal cursor-pointer"
            >
              我已了解回滚操作的影响，确认继续
            </Label>
          </div>
        </AlertDialogDescription>
      </AlertDialogHeader>

      <AlertDialogFooter>
        <AlertDialogCancel>取消</AlertDialogCancel>
        <AlertDialogAction
          :disabled="!canSubmit"
          class="bg-amber-600 hover:bg-amber-700 focus:ring-amber-600"
          @click="emits('confirm')"
        >
          <RotateCcw class="h-4 w-4 mr-2" />
          确认回滚
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
