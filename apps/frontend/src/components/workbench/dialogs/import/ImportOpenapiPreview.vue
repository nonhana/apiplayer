<script lang="ts" setup>
import type { HttpMethod } from '@/types/api'
import type { ConflictStrategy, ImportPreview } from '@/types/import'
import { AlertTriangle, ChevronDown, ChevronRight, FileText, FolderOpen } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { methodColors } from '@/constants/api'
import { useApiTreeStore } from '@/stores/useApiTreeStore'

const props = defineProps<{
  preview: ImportPreview
  isLoading?: boolean
}>()

const emits = defineEmits<{
  (e: 'submit', config: {
    conflictStrategy: ConflictStrategy
    targetGroupId?: string
    createMissingGroups: boolean
  }): void
  (e: 'back'): void
}>()

const apiTreeStore = useApiTreeStore()
const { flatGroups } = storeToRefs(apiTreeStore)

/** 按 tags 自动创建分组（Reka-ui 不支持清空选项，，，） */
const AUTO_GROUP_VALUE = '__auto__'

// 配置选项
const conflictStrategy = ref<ConflictStrategy>('skip')
const targetGroupId = ref<string>(AUTO_GROUP_VALUE)
const createMissingGroups = ref(true)

// 分组展开状态
const expandedGroups = ref<Set<string>>(new Set())

// 按分组组织 API
const apisGroupedByGroup = computed(() => {
  const groups = new Map<string, typeof props.preview.apis>()
  for (const api of props.preview.apis) {
    const existing = groups.get(api.groupName) || []
    existing.push(api)
    groups.set(api.groupName, existing)
  }
  return groups
})

function toggleGroup(groupName: string) {
  if (expandedGroups.value.has(groupName)) {
    expandedGroups.value.delete(groupName)
  }
  else {
    expandedGroups.value.add(groupName)
  }
}

function handleSubmit() {
  emits('submit', {
    conflictStrategy: conflictStrategy.value,
    targetGroupId: targetGroupId.value === AUTO_GROUP_VALUE ? undefined : targetGroupId.value,
    createMissingGroups: createMissingGroups.value,
  })
}

function getGroupDisplayName(group: { name: string, level: number }) {
  return '  '.repeat(group.level) + group.name
}

function getMethodClass(method: HttpMethod) {
  return methodColors[method] || 'text-gray-500'
}
</script>

<template>
  <div class="space-y-4">
    <!-- 文档信息 -->
    <div class="bg-muted/50 rounded-lg p-4">
      <div class="flex items-start gap-3">
        <FileText class="h-5 w-5 text-primary mt-0.5" />
        <div class="flex-1 min-w-0">
          <h4 class="font-medium">
            {{ preview.info.title }}
          </h4>
          <p class="text-sm text-muted-foreground">
            版本 {{ preview.info.version }}
          </p>
          <p v-if="preview.info.description" class="text-sm text-muted-foreground mt-1 line-clamp-2">
            {{ preview.info.description }}
          </p>
        </div>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="grid grid-cols-3 gap-4">
      <div class="bg-muted/50 rounded-lg p-3 text-center">
        <div class="text-2xl font-bold text-primary">
          {{ preview.stats.totalApis }}
        </div>
        <div class="text-xs text-muted-foreground">
          总接口数
        </div>
      </div>
      <div class="bg-muted/50 rounded-lg p-3 text-center">
        <div class="text-2xl font-bold text-green-600">
          {{ preview.stats.newApis }}
        </div>
        <div class="text-xs text-muted-foreground">
          新增接口
        </div>
      </div>
      <div class="bg-muted/50 rounded-lg p-3 text-center">
        <div class="text-2xl font-bold" :class="preview.stats.conflictApis > 0 ? 'text-amber-500' : 'text-muted-foreground'">
          {{ preview.stats.conflictApis }}
        </div>
        <div class="text-xs text-muted-foreground">
          冲突接口
        </div>
      </div>
    </div>

    <!-- 冲突警告 -->
    <div v-if="preview.stats.conflictApis > 0" class="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
      <AlertTriangle class="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
      <div class="text-sm">
        <p class="font-medium text-amber-700 dark:text-amber-400">
          发现 {{ preview.stats.conflictApis }} 个接口与现有接口冲突
        </p>
        <p class="text-amber-600 dark:text-amber-500 mt-1">
          请选择冲突处理策略
        </p>
      </div>
    </div>

    <Separator />

    <!-- 配置选项 -->
    <div class="space-y-4">
      <!-- 冲突处理策略 -->
      <div v-if="preview.stats.conflictApis > 0" class="space-y-2">
        <Label>冲突处理策略</Label>
        <RadioGroup v-model="conflictStrategy" class="space-y-2">
          <div class="flex items-center space-x-2">
            <RadioGroupItem id="skip" value="skip" />
            <Label for="skip" class="font-normal cursor-pointer">
              跳过冲突接口
            </Label>
          </div>
          <div class="flex items-center space-x-2">
            <RadioGroupItem id="overwrite" value="overwrite" />
            <Label for="overwrite" class="font-normal cursor-pointer">
              覆盖现有接口
            </Label>
          </div>
          <div class="flex items-center space-x-2">
            <RadioGroupItem id="rename" value="rename" />
            <Label for="rename" class="font-normal cursor-pointer">
              重命名新接口（添加 _imported 后缀）
            </Label>
          </div>
        </RadioGroup>
      </div>

      <!-- 目标分组 -->
      <div class="space-y-2">
        <Label for="target-group">目标分组（可选）</Label>
        <Select v-model="targetGroupId">
          <SelectTrigger id="target-group">
            <SelectValue placeholder="按 tags 自动创建分组" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="AUTO_GROUP_VALUE">
              <span class="text-muted-foreground">按 tags 自动创建分组</span>
            </SelectItem>
            <SelectItem
              v-for="group in flatGroups"
              :key="group.id"
              :value="group.id"
            >
              {{ getGroupDisplayName(group) }}
            </SelectItem>
          </SelectContent>
        </Select>
        <p class="text-xs text-muted-foreground">
          不选择则根据 OpenAPI 文档中的 tags 自动创建分组
        </p>
      </div>

      <!-- 自动创建分组 -->
      <div class="flex items-center space-x-2">
        <Checkbox
          id="create-groups"
          :checked="createMissingGroups"
          :disabled="targetGroupId !== AUTO_GROUP_VALUE"
          @update:checked="createMissingGroups = $event as boolean"
        />
        <Label for="create-groups" class="font-normal cursor-pointer">
          自动创建不存在的分组
        </Label>
      </div>
    </div>

    <Separator />

    <!-- API 预览列表 -->
    <div class="space-y-2">
      <Label>接口预览</Label>
      <div class="p-2 space-y-1">
        <Collapsible
          v-for="[groupName, apis] in apisGroupedByGroup"
          :key="groupName"
          :open="expandedGroups.has(groupName)"
          @update:open="toggleGroup(groupName)"
        >
          <CollapsibleTrigger class="flex items-center gap-2 w-full p-2 hover:bg-muted rounded-md text-left">
            <component
              :is="expandedGroups.has(groupName) ? ChevronDown : ChevronRight"
              class="h-4 w-4 text-muted-foreground shrink-0"
            />
            <FolderOpen class="h-4 w-4 text-muted-foreground shrink-0" />
            <span class="text-sm font-medium flex-1 truncate">{{ groupName }}</span>
            <Badge variant="secondary" class="ml-auto">
              {{ apis.length }}
            </Badge>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div class="ml-6 pl-4 border-l space-y-1">
              <div
                v-for="api in apis"
                :key="`${api.method}-${api.path}`"
                class="flex items-center gap-2 p-2 text-sm rounded-md"
                :class="api.hasConflict ? 'bg-amber-50 dark:bg-amber-950/20' : 'hover:bg-muted'"
              >
                <span
                  class="font-mono text-xs font-bold w-16 shrink-0"
                  :class="getMethodClass(api.method)"
                >
                  {{ api.method }}
                </span>
                <span class="font-mono text-xs text-muted-foreground truncate flex-1">
                  {{ api.path }}
                </span>
                <span class="text-xs truncate max-w-[120px]">
                  {{ api.name }}
                </span>
                <Badge v-if="api.hasConflict" variant="outline" class="text-amber-600 border-amber-300 shrink-0">
                  冲突
                </Badge>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex justify-between">
      <Button variant="outline" :disabled="isLoading" @click="emits('back')">
        上一步
      </Button>
      <Button :disabled="isLoading" @click="handleSubmit">
        开始导入
      </Button>
    </div>
  </div>
</template>
