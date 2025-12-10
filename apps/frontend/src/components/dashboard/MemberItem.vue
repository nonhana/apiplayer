<script lang="ts" setup>
import type { RoleName } from '@/constants/roles'
import type { ProjectMember } from '@/types/project'
import type { RoleItem } from '@/types/role'
import type { TeamMember } from '@/types/team'
import { Crown, Trash2 } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { projectApi } from '@/api/project'
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
import { ROLE_DISPLAY_MAP, ROLE_NAME } from '@/constants/roles'
import { cn, getUserFallbackIcon } from '@/lib/utils'
import { useUserStore } from '@/stores/useUserStore'

export type MemberType = 'team' | 'project'

const props = defineProps<{
  type: MemberType
  roles: RoleItem[]
  isAdmin: boolean
  member: TeamMember | ProjectMember
  teamId?: string
  isOwner?: boolean
  projectId?: string
}>()

const emits = defineEmits<{
  (e: 'updateMember', member: TeamMember | ProjectMember): void
  (e: 'deleteMember', member: TeamMember | ProjectMember): void
}>()

const isTeamMode = computed(() => props.type === 'team')
const isProjectMode = computed(() => props.type === 'project')

const teamMember = computed(() => props.member as TeamMember)

const { user } = useUserStore()

const isMe = computed(() => props.member.user.id === user!.id)

const isTeamOwner = computed(() => isTeamMode.value && props.isOwner)

const isUpdatingRole = ref(false)

/** 获取角色显示名称 */
function getRoleDisplayName(roleName: RoleName) {
  const role = props.roles.find(r => r.name === roleName)
  if (role?.description)
    return role.description
  return ROLE_DISPLAY_MAP[roleName] ?? roleName
}

/** 获取角色徽章样式 */
function getRoleBadgeVariant(roleName: string): 'default' | 'secondary' | 'outline' {
  // 最高权限角色
  if (roleName === ROLE_NAME.TEAM_OWNER || roleName === ROLE_NAME.PROJECT_ADMIN)
    return 'default'
  // 次高权限角色
  if (roleName === ROLE_NAME.TEAM_ADMIN || roleName === ROLE_NAME.PROJECT_EDITOR)
    return 'secondary'
  return 'outline'
}

/** 获取可选角色列表（排除 Owner 角色，Owner 不可被分配） */
const selectableRoles = computed(() =>
  props.roles.filter(r => r.name !== ROLE_NAME.TEAM_OWNER),
)

/** 更新 Project 成员角色 */
async function updateProjectRole(memberId: string, newRoleId: string) {
  if (!isProjectMode.value)
    return

  isUpdatingRole.value = true
  try {
    const updatedMember = await projectApi.updateProjectMember(
      props.projectId!,
      memberId,
      { roleId: newRoleId },
    )

    emits('updateMember', updatedMember)

    toast.success('角色已更新')
  }
  finally {
    isUpdatingRole.value = false
  }
}

/** 更新 Team 成员角色 */
async function updateTeamRole(memberId: string, newRoleId: string) {
  if (!isTeamMode.value)
    return

  isUpdatingRole.value = true
  try {
    const updatedMember = await teamApi.updateTeamMember(
      props.teamId!,
      memberId,
      { roleId: newRoleId },
    )

    emits('updateMember', updatedMember)

    toast.success('角色已更新')
  }
  finally {
    isUpdatingRole.value = false
  }
}

/** 处理角色更新 */
async function handleUpdateRole(newRoleId: string) {
  if (props.member.role.id === newRoleId)
    return

  if (isProjectMode.value) {
    await updateProjectRole(props.member.id, newRoleId)
  }
  else if (isTeamMode.value) {
    await updateTeamRole(props.member.id, newRoleId)
  }
}
</script>

<template>
  <div
    :class="cn(
      'flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors',
      isMe && 'border-2 border-primary',
    )"
  >
    <Avatar class="h-10 w-10 border">
      <AvatarImage v-if="member.user.avatar" :src="member.user.avatar" />
      <AvatarFallback class="text-sm font-medium">
        {{ getUserFallbackIcon(member.user.name) }}
      </AvatarFallback>
    </Avatar>

    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2">
        <span class="font-medium truncate">{{ member.user.name }}</span>
        <span
          v-if="isTeamMode && teamMember.nickname"
          class="text-xs text-muted-foreground"
        >
          ({{ teamMember.nickname }})
        </span>
        <Badge :variant="getRoleBadgeVariant(member.role.name)" class="shrink-0">
          <Crown v-if="isTeamOwner" class="h-3 w-3 mr-1" />
          {{ getRoleDisplayName(member.role.name) }}
        </Badge>
      </div>
      <p class="text-sm text-muted-foreground truncate">
        {{ member.user.email }}
      </p>
    </div>

    <div v-if="isAdmin && !isTeamOwner" class="flex items-center gap-2">
      <Select
        :model-value="member.role.id"
        :disabled="isUpdatingRole"
        @update:model-value="(v) => handleUpdateRole(v as string)"
      >
        <SelectTrigger class="h-8 w-28 text-xs">
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

    <div v-else-if="isTeamOwner" class="text-xs text-muted-foreground">
      创建者
    </div>
  </div>
</template>
