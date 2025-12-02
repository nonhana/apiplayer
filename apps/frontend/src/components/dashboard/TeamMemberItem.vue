<script lang="ts" setup>
import type { RoleItem } from '@/types/role'
import type { TeamMember } from '@/types/team'
import { Crown, Trash2 } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { teamApi } from '@/api/team'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ROLE_NAME } from '@/constants/roles'
import { getUserFallbackIcon } from '@/lib/utils'

const props = defineProps<{
  teamId: string
  member: TeamMember
  teamRoles: RoleItem[]
  isCurrentUserAdmin: boolean
}>()

const emits = defineEmits<{
  (e: 'updateRole', member: TeamMember): void
  (e: 'deleteMember', member: TeamMember): void
}>()

const isUpdatingRole = ref(false)

/** 是否是团队所有者 */
const isOwner = computed(() => props.member.role.name === ROLE_NAME.TEAM_OWNER)

/** 角色显示名称 */
function getRoleDisplayName(roleName: string) {
  const role = props.teamRoles.find(r => r.name === roleName)
  if (role?.description)
    return role.description
  // 兜底：根据角色名称返回中文名
  const fallbackMap: Record<string, string> = {
    'team:owner': '所有者',
    'team:admin': '管理员',
    'team:member': '成员',
    'team:guest': '访客',
  }
  return fallbackMap[roleName] ?? roleName
}

/** 角色徽章颜色 */
function getRoleBadgeVariant(roleName: string): 'default' | 'secondary' | 'outline' {
  if (roleName === ROLE_NAME.TEAM_OWNER)
    return 'default'
  if (roleName === ROLE_NAME.TEAM_ADMIN)
    return 'secondary'
  return 'outline'
}

/** 获取可选角色列表（排除 Owner 角色） */
const selectableRoles = computed(() =>
  props.teamRoles.filter(r => r.name !== ROLE_NAME.TEAM_OWNER),
)

/** 更新成员角色 */
async function handleUpdateRole(newRoleId: string) {
  if (props.member.role.id === newRoleId)
    return

  isUpdatingRole.value = true
  try {
    const updatedMember = await teamApi.updateTeamMember(
      props.teamId,
      props.member.id,
      { roleId: newRoleId },
    )

    emits('updateRole', updatedMember)
    toast.success('角色已更新')
  }
  finally {
    isUpdatingRole.value = false
  }
}
</script>

<template>
  <div class="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
    <Avatar class="h-10 w-10 border">
      <AvatarImage v-if="member.user.avatar" :src="member.user.avatar" />
      <AvatarFallback class="text-sm font-medium">
        {{ getUserFallbackIcon(member.user.name) }}
      </AvatarFallback>
    </Avatar>

    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2">
        <span class="font-medium truncate">{{ member.user.name }}</span>
        <!-- 团队昵称显示 -->
        <span
          v-if="member.nickname"
          class="text-xs text-muted-foreground"
        >
          ({{ member.nickname }})
        </span>
        <Badge :variant="getRoleBadgeVariant(member.role.name)" class="shrink-0">
          <Crown v-if="isOwner" class="h-3 w-3 mr-1" />
          {{ getRoleDisplayName(member.role.name) }}
        </Badge>
      </div>
      <p class="text-sm text-muted-foreground truncate">
        {{ member.user.email }}
      </p>
    </div>

    <!-- 操作按钮（仅管理员可见，且不能操作所有者） -->
    <div v-if="isCurrentUserAdmin && !isOwner" class="flex items-center gap-2">
      <Select
        :model-value="member.role.id"
        :disabled="isUpdatingRole"
        @update:model-value="(v) => handleUpdateRole(v as string)"
      >
        <SelectTrigger class="h-8 w-[100px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="role in selectableRoles"
            :key="role.id"
            :value="role.id"
          >
            {{ role.description || role.name }}
          </SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="ghost"
        size="icon"
        class="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
        @click="emits('deleteMember', member)"
      >
        <Trash2 class="h-4 w-4" />
      </Button>
    </div>

    <!-- 所有者标记 -->
    <div v-else-if="isOwner" class="text-xs text-muted-foreground">
      创建者
    </div>
  </div>
</template>
