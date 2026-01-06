<script lang="ts" setup>
import type { UserBriefInfo } from '@/types/user'
import { X } from 'lucide-vue-next'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { getAbbreviation } from '@/lib/utils'

defineProps<{
  user: UserBriefInfo
  disabled?: boolean
}>()

const emits = defineEmits<{
  (e: 'removeUser', userId: string): void
}>()
</script>

<template>
  <Badge
    variant="secondary"
    class="pl-1.5 pr-1 py-0.5 gap-1.5"
  >
    <Avatar class="h-5 w-5">
      <AvatarImage v-if="user.avatar" :src="user.avatar" />
      <AvatarFallback class="text-[10px]">
        {{ getAbbreviation(user.name, 'U') }}
      </AvatarFallback>
    </Avatar>
    <span class="text-xs">{{ user.name }}</span>
    <button
      type="button"
      class="rounded-sm hover:bg-muted p-0.5 transition-colors"
      :disabled="disabled"
      @click="emits('removeUser', user.id)"
    >
      <X class="h-3 w-3" />
    </button>
  </Badge>
</template>
