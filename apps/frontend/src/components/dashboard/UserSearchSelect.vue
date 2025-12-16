<script lang="ts" setup>
import type { UserSearchItem } from '@/types/user'
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
import { getUserFallbackIcon } from '@/lib/utils'
import UserBadge from '../UserBadge.vue'

/**
 * - 多选：string[]（用户 ID 数组）
 * - 单选：string | undefined（单个用户 ID）
 */
type ModelValue = string | string[] | undefined

const props = withDefaults(defineProps<{
  /** 需要排除的用户 ID 列表（比如已是成员的用户） */
  excludeUserIds?: string[]
  /** 占位符文本 */
  placeholder?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 最多选择用户数量 */
  max?: number
  /** 是否开启多选，默认 true */
  multiple?: boolean
  /** 已选用户信息（用于回显） */
  selectedUserInfo?: UserSearchItem | UserSearchItem[]
}>(), {
  placeholder: '搜索用户...',
  multiple: true,
})

const emit = defineEmits<{
  (e: 'change', users: UserSearchItem[]): void
}>()

const modelValue = defineModel<ModelValue>('modelValue')

const isOpen = ref(false)
const searchQuery = ref('')
const searchResults = ref<UserSearchItem[]>([])
const isSearching = ref(false)

const userCache = ref<Map<string, UserSearchItem>>(new Map())

function initUserCache() {
  if (!props.selectedUserInfo)
    return

  const users = Array.isArray(props.selectedUserInfo)
    ? props.selectedUserInfo
    : [props.selectedUserInfo]

  users.forEach(user => userCache.value.set(user.id, user))
}

// 监听 selectedUserInfo 变化，更新缓存
watch(
  () => props.selectedUserInfo,
  () => initUserCache(),
  { immediate: true, deep: true },
)

/** 将搜索结果加入缓存 */
watch(searchResults, (results) => {
  results.forEach(user => userCache.value.set(user.id, user))
})

const selectedIds = computed<string[]>(() => {
  if (props.multiple) {
    return (modelValue.value as string[] | undefined) ?? []
  }
  const val = modelValue.value as string | undefined
  return val ? [val] : []
})

const selectedUsers = computed<UserSearchItem[]>(() => {
  return selectedIds.value
    .map(id => userCache.value.get(id))
    .filter((u): u is UserSearchItem => !!u)
})

type ComboboxValue = UserSearchItem[] | UserSearchItem | undefined

function isUserSearchItem(val: unknown): val is UserSearchItem {
  return val !== null && typeof val === 'object' && 'id' in val && 'email' in val
}

function normalizeToArray(val: ComboboxValue): UserSearchItem[] {
  if (Array.isArray(val))
    return val
  if (isUserSearchItem(val))
    return [val]
  return []
}

const internalSelected = computed<ComboboxValue>({
  get: () => props.multiple ? selectedUsers.value : selectedUsers.value[0],
  set: (newV) => {
    const users = normalizeToArray(newV)

    // 更新缓存
    users.forEach(user => userCache.value.set(user.id, user))

    // 更新 modelValue
    if (props.multiple) {
      modelValue.value = users.map(u => u.id)
    }
    else {
      modelValue.value = users[0]?.id
    }

    emit('change', users)
  },
})

/** 过滤掉已排除的用户（不过滤已选择的，因为 Combobox 会自动处理） */
const filteredResults = computed(() => {
  const excludeIds = new Set(props.excludeUserIds ?? [])
  return searchResults.value.filter(user => !excludeIds.has(user.id))
})

/** 搜索用户 */
async function searchUsers(query?: string) {
  isSearching.value = true
  try {
    const res = await userApi.searchUsers({ search: query, limit: 10 })
    searchResults.value = res.users
  }
  finally {
    isSearching.value = false
  }
}

/** 防抖搜索 */
const debouncedSearch = useDebounceFn(searchUsers, 300)

/** 监听搜索输入变化 */
watch(searchQuery, (query) => {
  const isQueryValid = query?.trim()
  if (isQueryValid) {
    isSearching.value = true
    debouncedSearch(query)
  }
  else {
    searchResults.value = []
  }
})

/** 获取用户的显示标签（用于 Combobox 的 displayValue） */
function getUserDisplayLabel(user?: UserSearchItem) {
  return user?.name ?? ''
}

/** 移除已经选择的用户 */
function removeSelectedUser(userId: string) {
  if (props.multiple) {
    modelValue.value = selectedIds.value.filter(id => id !== userId)
  }
  else {
    modelValue.value = undefined
  }
  emit('change', selectedUsers.value.filter(u => u.id !== userId))
}

watch(selectedIds, (newVal) => {
  if (props.multiple && props.max !== undefined && newVal.length > props.max) {
    toast.error(`最多只能选择 ${props.max} 个用户`)
    modelValue.value = newVal.slice(0, props.max)
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
            v-model="searchQuery"
            :placeholder="placeholder"
            :display-value="getUserDisplayLabel"
            class="w-full"
            auto-focus
          />
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
          <!-- 搜索中状态 -->
          <div v-if="isSearching && filteredResults.length === 0" class="py-6 text-center">
            <Loader2 class="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
            <p class="text-sm text-muted-foreground mt-2">
              搜索中...
            </p>
          </div>

          <!-- 空状态提示 -->
          <ComboboxEmpty v-else-if="!searchQuery?.trim()">
            输入关键词搜索用户
          </ComboboxEmpty>

          <!-- 无结果状态 -->
          <ComboboxEmpty v-else-if="!isSearching && filteredResults.length === 0">
            未找到匹配的用户
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
                  {{ getUserFallbackIcon(user.name) }}
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
