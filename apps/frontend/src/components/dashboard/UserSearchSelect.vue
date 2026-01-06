<script lang="ts" setup>
import type { UserBriefInfo } from '@/types/user'
import { useDebounceFn } from '@vueuse/core'
import { Check, Loader2, X } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { userApi } from '@/api/user'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Combobox,
  ComboboxAnchor,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList,
  ComboboxViewport,
} from '@/components/ui/combobox'
import { getAbbreviation } from '@/lib/utils'
import UserBadge from '../common/UserBadge.vue'
import Input from '../ui/input/Input.vue'

const props = withDefaults(defineProps<{
  /** 需要排除的用户 ID 列表 */
  excludeIds?: string[]
  /** 占位符文本 */
  placeholder?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 最多选择用户数量 */
  max?: number
  /** 是否开启多选，默认 true */
  multiple?: boolean
  /** 本地搜索选项，若存在，则直接在 options 中进行筛选而非调用 API */
  options?: UserBriefInfo[]
  /** 自定义空状态提示文本（本地模式下无可选项时显示） */
  emptyText?: string
}>(), {
  placeholder: '搜索用户...',
  multiple: true,
})

/**
 * v-model 绑定值：直接绑定用户对象
 * - 多选：UserBriefInfo[]
 * - 单选：UserBriefInfo | undefined
 */
type ModelValue = UserBriefInfo | UserBriefInfo[] | undefined

const modelValue = defineModel<ModelValue>('modelValue')

const isOpen = ref(false)
const searchQuery = ref('')
const searchResults = ref<UserBriefInfo[]>([])
const isSearching = ref(false)

/** 是否使用本地搜索模式 */
const isLocalMode = computed(() => Array.isArray(props.options))

/** 将 modelValue 统一转换为数组形式 */
function normalizeToArray(val: ModelValue): UserBriefInfo[] {
  if (!val)
    return []
  return Array.isArray(val) ? val : [val]
}

/** 当前选中的用户列表 */
const selectedUsers = computed<UserBriefInfo[]>(() => normalizeToArray(modelValue.value))

/** Combobox 内部绑定值 */
const internalSelected = computed<ModelValue>({
  get: () => props.multiple ? selectedUsers.value : selectedUsers.value[0],
  set: (newV) => {
    const users = normalizeToArray(newV)
    modelValue.value = props.multiple ? users : users[0]
  },
})

/** 本地模式下的搜索结果 */
const localSearchResults = computed(() => {
  if (!isLocalMode.value || !props.options)
    return []

  const query = searchQuery.value?.toLowerCase().trim()

  if (!query)
    return props.options

  return props.options.filter(user =>
    user.name?.toLowerCase().includes(query)
    || user.email?.toLowerCase().includes(query)
    || user.username?.toLowerCase().includes(query),
  )
})

/** 过滤掉已排除的用户和已选择的用户 */
const filteredResults = computed(() => {
  const excludeIds = new Set([
    ...(props.excludeIds ?? []),
    ...selectedUsers.value.map(u => u.id),
  ])
  const results = isLocalMode.value ? localSearchResults.value : searchResults.value
  return results.filter(user => !excludeIds.has(user.id))
})

/** 搜索用户 */
async function searchUsers(query?: string) {
  isSearching.value = true
  try {
    const res = await userApi.searchUsers({
      search: query,
      limit: 100,
    })
    searchResults.value = res.users
  }
  finally {
    isSearching.value = false
  }
}

const debouncedSearch = useDebounceFn(searchUsers, 300)

watch(searchQuery, (query) => {
  if (isLocalMode.value)
    return

  const isQueryValid = query?.trim()
  if (isQueryValid) {
    isSearching.value = true
    debouncedSearch(query)
  }
  else {
    searchResults.value = []
  }
})

/** 移除已经选择的用户 */
function removeSelectedUser(userId: string) {
  const filtered = selectedUsers.value.filter(u => u.id !== userId)
  modelValue.value = props.multiple ? filtered : undefined
}

watch(selectedUsers, (users) => {
  if (props.multiple && props.max !== undefined && users.length > props.max) {
    toast.error(`最多只能选择 ${props.max} 个用户`)
    modelValue.value = users.slice(0, props.max)
  }
})
</script>

<template>
  <div class="space-y-2">
    <div v-if="selectedUsers.length > 0 && multiple" class="flex flex-wrap gap-1.5">
      <UserBadge
        v-for="user in selectedUsers"
        :key="user.id"
        :user="user"
        :disabled="disabled"
        @remove-user="removeSelectedUser"
      />
    </div>

    <!-- Combobox 搜索选择器 -->
    <Combobox
      v-model="internalSelected"
      v-model:open="isOpen"
      :multiple="multiple"
      ignore-filter
      :disabled="disabled"
      reset-search-term-on-blur
    >
      <ComboboxAnchor class="w-full">
        <div class="relative">
          <ComboboxInput
            as-child
            class="w-full"
          >
            <Input
              v-model="searchQuery"
              :placeholder="placeholder"
              :disabled="disabled"
              @focus="isOpen = true"
            />
          </ComboboxInput>
          <X
            v-if="selectedUsers.length > 0 && !multiple && !isSearching"
            class="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer"
            @click="removeSelectedUser(selectedUsers[0]!.id)"
          />
          <Loader2
            v-if="isSearching"
            class="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground"
          />
        </div>
      </ComboboxAnchor>

      <ComboboxList
        class="w-(--reka-combobox-trigger-width)"
        align="start"
        :side-offset="4"
      >
        <ComboboxViewport class="max-h-60">
          <!-- 远程模式：搜索中状态 -->
          <div v-if="!isLocalMode && isSearching && filteredResults.length === 0" class="py-6 text-center">
            <Loader2 class="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
            <p class="text-sm text-muted-foreground mt-2">
              搜索中...
            </p>
          </div>

          <!-- 远程模式：未输入搜索词 -->
          <ComboboxEmpty v-else-if="!isLocalMode && !searchQuery?.trim()">
            输入关键词搜索用户
          </ComboboxEmpty>

          <!-- 无结果状态 -->
          <ComboboxEmpty v-else-if="filteredResults.length === 0">
            {{ emptyText ?? '未找到匹配的用户' }}
          </ComboboxEmpty>

          <!-- 搜索结果列表 -->
          <template v-else>
            <ComboboxItem
              v-for="user in filteredResults"
              :key="user.id"
              :value="user"
              class="flex items-center gap-3 py-2"
            >
              <Avatar class="h-8 w-8">
                <AvatarImage v-if="user.avatar" :src="user.avatar" />
                <AvatarFallback class="text-xs">
                  {{ getAbbreviation(user.name, 'U') }}
                </AvatarFallback>
              </Avatar>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">
                  {{ user.name }}
                </p>
                <p class="text-xs text-muted-foreground truncate">
                  {{ user.email }}
                </p>
              </div>
              <ComboboxItemIndicator>
                <Check class="h-4 w-4 text-primary" />
              </ComboboxItemIndicator>
            </ComboboxItem>
          </template>
        </ComboboxViewport>
      </ComboboxList>
    </Combobox>
  </div>
</template>
