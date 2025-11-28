<script lang="ts" setup>
import type { UserSearchItem } from '@/types/user'
import { useDebounceFn } from '@vueuse/core'
import { Check, Loader2, X } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { userApi } from '@/api/user'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
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

const props = defineProps<{
  /** 需要排除的用户 ID 列表（比如已是成员的用户） */
  excludeUserIds?: string[]
  /** 占位符文本 */
  placeholder?: string
  /** 是否禁用 */
  disabled?: boolean
}>()

/** 选中的用户列表 */
const selectedUsers = defineModel<UserSearchItem[]>('modelValue', { default: [] })

const isOpen = ref(false)
const searchQuery = ref('')
const searchResults = ref<UserSearchItem[]>([])
const isSearching = ref(false)

/** 获取用户头像 Fallback */
function getAvatarInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1)
    return (parts[0]?.charAt(0) ?? 'U').toUpperCase()
  return ((parts[0]?.charAt(0) ?? '') + (parts[1]?.charAt(0) ?? '')).toUpperCase() || 'U'
}

/** 过滤掉已排除的用户（不过滤已选择的，因为 Combobox 会自动处理） */
const filteredResults = computed(() => {
  const excludeIds = new Set(props.excludeUserIds ?? [])
  return searchResults.value.filter(user => !excludeIds.has(user.id))
})

/** 搜索用户 */
async function searchUsers(query: string) {
  if (!query.trim()) {
    searchResults.value = []
    return
  }

  isSearching.value = true
  try {
    const response = await userApi.searchUsers({ search: query, limit: 10 })
    searchResults.value = response.users
  }
  catch {
    searchResults.value = []
  }
  finally {
    isSearching.value = false
  }
}

/** 防抖搜索 */
const debouncedSearch = useDebounceFn(searchUsers, 300)

/** 监听搜索输入变化 */
watch(searchQuery, (query) => {
  debouncedSearch(query)
})

/** 移除用户 */
function removeUser(userId: string) {
  selectedUsers.value = selectedUsers.value.filter(u => u.id !== userId)
}

/** 禁用内置过滤，使用后端搜索 */
function noFilter() {
  return true
}

/** 获取用户的显示标签（用于 Combobox 的 displayValue） */
function getUserDisplayLabel(user: UserSearchItem) {
  return user.name
}
</script>

<template>
  <div class="space-y-2">
    <!-- 已选用户展示 -->
    <div v-if="selectedUsers.length > 0" class="flex flex-wrap gap-1.5">
      <Badge
        v-for="user in selectedUsers"
        :key="user.id"
        variant="secondary"
        class="pl-1.5 pr-1 py-0.5 gap-1.5"
      >
        <Avatar class="h-5 w-5">
          <AvatarImage v-if="user.avatar" :src="user.avatar" />
          <AvatarFallback class="text-[10px]">
            {{ getAvatarInitials(user.name) }}
          </AvatarFallback>
        </Avatar>
        <span class="text-xs">{{ user.name }}</span>
        <button
          type="button"
          class="rounded-sm hover:bg-muted p-0.5 transition-colors"
          :disabled="disabled"
          @click="removeUser(user.id)"
        >
          <X class="h-3 w-3" />
        </button>
      </Badge>
    </div>

    <!-- Combobox 搜索选择器 -->
    <Combobox
      v-model="selectedUsers"
      v-model:open="isOpen"
      v-model:search-term="searchQuery"
      multiple
      :filter-function="noFilter"
      :display-value="getUserDisplayLabel"
      :disabled="disabled"
      reset-search-term-on-blur
    >
      <ComboboxAnchor class="w-full">
        <div class="relative">
          <ComboboxInput
            :placeholder="placeholder ?? '搜索用户...'"
            class="w-full"
            auto-focus
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
        <ComboboxViewport class="max-h-[240px]">
          <!-- 搜索中状态 -->
          <div v-if="isSearching && filteredResults.length === 0" class="py-6 text-center">
            <Loader2 class="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
            <p class="text-sm text-muted-foreground mt-2">
              搜索中...
            </p>
          </div>

          <!-- 空状态提示 -->
          <ComboboxEmpty v-else-if="!searchQuery">
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
                  {{ getAvatarInitials(user.name) }}
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
