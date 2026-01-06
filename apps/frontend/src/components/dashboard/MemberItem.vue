<script lang="ts" setup>
import type { ProjectMember } from '@/types/project'
import type { TeamMember } from '@/types/team'
import { Crown, Trash2 } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
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
import { cn, getAbbreviation } from '@/lib/utils'
import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'

export type MemberType = 'team' | 'project'

const props = defineProps<{
  type: MemberType
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

const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const globalStore = useGlobalStore()
const { projectRoles, teamRoles } = storeToRefs(globalStore)

const isTeamMode = computed(() => props.type === 'team')

const curRoles = computed(() => isTeamMode.value ? teamRoles.value : projectRoles.value)

const teamMember = computed(() => props.member as TeamMember)

const isMe = computed(() => props.member.user.id === user.value?.id)

const isTeamOwner = computed(() => isTeamMode.value && props.isOwner)

const isUpdatingRole = ref(false)

function getRoleBadgeVariant(roleName: string) {
  if (roleName === ROLE_NAME.TEAM_OWNER || roleName === ROLE_NAME.PROJECT_ADMIN)
    return 'default'
  if (roleName === ROLE_NAME.TEAM_ADMIN || roleName === ROLE_NAME.PROJECT_EDITOR)
    return 'secondary'
  return 'outline'
}

/** 获取可选角色列表（排除 Owner） */
const selectableRoles = computed(() =>
  curRoles.value.filter(r => r.name !== ROLE_NAME.TEAM_OWNER),
)

/** 处理角色更新 */
async function handleUpdateRole(newRoleId: string) {
  if (props.member.role.id === newRoleId)
    return

  isUpdatingRole.value = true
  try {
    let updatedMember: TeamMember | ProjectMember
    if (isTeamMode.value) {
      updatedMember = await teamApi.updateTeamMember(
        props.teamId!,
        props.member.id,
        { roleId: newRoleId },
      )
    }
    else {
      updatedMember = await projectApi.updateProjectMember(
        props.projectId!,
        props.member.id,
        { roleId: newRoleId },
      )
    }
    emits('updateMember', updatedMember)
    toast.success('角色已更新')
  }
  catch (error) {
    console.error('更新角色失败', error)
  }
  finally {
    isUpdatingRole.value = false
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
        {{ getAbbreviation(member.user.name, 'U') }}
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
          {{ ROLE_DISPLAY_MAP[member.role.name] }}
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
