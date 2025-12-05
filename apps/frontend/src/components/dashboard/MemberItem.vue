<script lang="ts" setup>
import type { RoleName } from '@/constants/roles'
import type { ProjectMember } from '@/types/project'
import type { RoleItem } from '@/types/role'
import type { TeamMember } from '@/types/team'
import { Crown, Trash2 } from 'lucide-vue-next'
import { computed, ref } from 'vue'
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
import { getUserFallbackIcon } from '@/lib/utils'

/** 成员类型：团队成员 or 项目成员 */
export type MemberType = 'team' | 'project'

type Props = {
  /** 成员类型 */
  type: MemberType
  /** 可选角色列表 */
  roles: RoleItem[]
  /** 当前用户是否有管理权限 */
  isCurrentUserAdmin: boolean
} & (
  {
    type: 'team'
    member: TeamMember
  } | {
    type: 'project'
    member: ProjectMember
  }
)

const props = defineProps<Props>()

const emits = defineEmits<{
  /** 更新成员角色 */
  (e: 'updateRole', memberId: string, newRoleId: string): void
  /** 删除成员 */
  (e: 'deleteMember', member: TeamMember | ProjectMember): void
}>()

const isUpdatingRole = ref(false)

/** 是否是团队所有者（仅团队成员有此概念） */
const isOwner = computed(() =>
  props.type === 'team' && props.member.role.name === ROLE_NAME.TEAM_OWNER,
)

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

/** 处理角色更新 */
function handleUpdateRole(newRoleId: string) {
  if (props.member.role.id === newRoleId)
    return

  isUpdatingRole.value = true
  emits('updateRole', props.member.id, newRoleId)
}

/** 重置更新状态（供父组件调用） */
function resetUpdatingState() {
  isUpdatingRole.value = false
}

defineExpose({
  resetUpdatingState,
})
</script>

<template>
  <div class="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
    <!-- 头像 -->
    <Avatar class="h-10 w-10 border">
      <AvatarImage v-if="member.user.avatar" :src="member.user.avatar" />
      <AvatarFallback class="text-sm font-medium">
        {{ getUserFallbackIcon(member.user.name) }}
      </AvatarFallback>
    </Avatar>

    <!-- 用户信息 -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2">
        <span class="font-medium truncate">{{ member.user.name }}</span>
        <!-- 团队昵称（仅团队成员显示） -->
        <span
          v-if="type === 'team' && member.nickname"
          class="text-xs text-muted-foreground"
        >
          ({{ member.nickname }})
        </span>
        <!-- 角色徽章 -->
        <Badge :variant="getRoleBadgeVariant(member.role.name)" class="shrink-0">
          <Crown v-if="isOwner" class="h-3 w-3 mr-1" />
          {{ getRoleDisplayName(member.role.name) }}
        </Badge>
      </div>
      <p class="text-sm text-muted-foreground truncate">
        {{ member.user.email }}
      </p>
    </div>

    <!-- 操作按钮：管理员可见，且不能操作所有者 -->
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

    <!-- 所有者标记（仅团队所有者显示） -->
    <div v-else-if="isOwner" class="text-xs text-muted-foreground">
      创建者
    </div>
  </div>
</template>
