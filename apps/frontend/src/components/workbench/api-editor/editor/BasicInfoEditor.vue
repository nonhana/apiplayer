<script lang="ts" setup>
import type { ApiStatus, HttpMethod } from '@/types/api'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import SearchInput from '@/components/common/SearchInput.vue'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  API_STATUSES,
  HTTP_METHODS,
  methodBadgeColors,
  statusColors,
  statusLabels,
} from '@/constants/api'
import { cn } from '@/lib/utils'
import { useApiEditorStore } from '@/stores/useApiEditorStore'
import { useProjectStore } from '@/stores/useProjectStore'
import TagsInput from './TagsInput.vue'

withDefaults(defineProps<{
  /** 是否禁用 */
  disabled?: boolean
}>(), {
  disabled: false,
})

const apiEditorStore = useApiEditorStore()
const projectStore = useProjectStore()

const { basicInfo } = storeToRefs(apiEditorStore)
const { projectMembers } = storeToRefs(projectStore)

const memberOptions = computed(() =>
  projectMembers.value.map(member => ({
    label: member.user.name,
    value: member.user.id,
  })),
)

/** 当前方法的样式类 */
const curMethodClass = computed(() => {
  return methodBadgeColors[basicInfo.value.method] ?? 'bg-slate-500/15 text-slate-600'
})

/** 当前状态的样式类 */
const curStatusClass = computed(() => {
  return statusColors[basicInfo.value.status] ?? 'bg-slate-500/15 text-slate-600'
})
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-2">
      <Label for="api-name">
        接口名称 <span class="text-destructive">*</span>
      </Label>
      <Input
        id="api-name"
        :model-value="basicInfo.name"
        placeholder="请输入接口名称"
        :disabled="disabled"
        class="font-medium"
        @update:model-value="apiEditorStore.updateBasicInfo('name', String($event))"
      />
    </div>

    <div class="flex gap-3">
      <div class="w-[130px] space-y-2">
        <Label for="api-method">
          请求方法 <span class="text-destructive">*</span>
        </Label>
        <Select
          :model-value="basicInfo.method"
          :disabled="disabled"
          @update:model-value="apiEditorStore.updateBasicInfo('method', $event as HttpMethod)"
        >
          <SelectTrigger id="api-method" :class="cn('font-bold', curMethodClass)">
            <SelectValue>{{ basicInfo.method }}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="method in HTTP_METHODS"
              :key="method"
              :value="method"
            >
              <span :class="cn('font-bold', methodBadgeColors[method])">
                {{ method }}
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="flex-1 space-y-2">
        <Label for="api-path">
          接口路径 <span class="text-destructive">*</span>
        </Label>
        <Input
          id="api-path"
          :model-value="basicInfo.path"
          placeholder="/api/example"
          :disabled="disabled"
          class="font-mono"
          @update:model-value="apiEditorStore.updateBasicInfo('path', String($event))"
        />
      </div>
    </div>

    <div class="flex gap-3">
      <div class="w-[200px] space-y-2">
        <Label for="api-status">接口状态</Label>
        <Select
          :model-value="basicInfo.status"
          :disabled="disabled"
          @update:model-value="apiEditorStore.updateBasicInfo('status', $event as ApiStatus)"
        >
          <SelectTrigger id="api-status" :class="curStatusClass">
            <SelectValue>{{ statusLabels[basicInfo.status] }}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="status in API_STATUSES"
              :key="status"
              :value="status"
            >
              <span :class="statusColors[status]">
                {{ statusLabels[status] }}
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="space-y-2">
        <Label for="api-owner">负责人</Label>
        <SearchInput
          :model-value="basicInfo.ownerId ?? ''"
          :options="memberOptions"
          :disabled="disabled"
          @update:model-value="apiEditorStore.updateBasicInfo('ownerId', $event as string)"
        />
      </div>
    </div>

    <div class="space-y-2">
      <Label for="api-description">接口描述</Label>
      <Textarea
        id="api-description"
        :model-value="basicInfo.description"
        placeholder="请输入接口描述（可选）"
        :disabled="disabled"
        rows="3"
        class="resize-none"
        @update:model-value="apiEditorStore.updateBasicInfo('description', String($event))"
      />
    </div>

    <div class="space-y-2">
      <Label>标签</Label>
      <TagsInput
        :tags="basicInfo.tags"
        :disabled="disabled"
        placeholder="输入标签后按回车添加"
        @update:tags="apiEditorStore.updateBasicInfo('tags', $event)"
      />
    </div>
  </div>
</template>
