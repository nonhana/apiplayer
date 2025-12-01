<script lang="ts" setup>
import type { ProjectItem, ProjectMember } from '@/types/project'
import type { RoleItem } from '@/types/role'
import { Trash2 } from 'lucide-vue-next'
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { projectApi } from '@/api/project'
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
import { getUserFallbackIcon } from '@/lib/utils'

const props = defineProps<{
  project: ProjectItem | null
  member: ProjectMember
  projectRoles: RoleItem[]
  isCurrentUserAdmin: boolean
}>()

const emits = defineEmits<{
  (e: 'updateRole', member: ProjectMember): void // 更新成员角色
  (e: 'deleteMember', member: ProjectMember): void // 删除成员
}>()

const updatingMemberId = ref<string | null>(null)

/** 角色显示名称 */
function getRoleDisplayName(roleName: string) {
  const role = props.projectRoles.find(r => r.name === roleName)
  if (role?.description)
    return role.description
  // 兜底：根据角色名称返回中文名
  const fallbackMap: Record<string, string> = {
    'project:admin': '管理员',
    'project:editor': '编辑者',
    'project:viewer': '查看者',
  }
  return fallbackMap[roleName] ?? roleName
}

/** 角色徽章颜色 */
function getRoleBadgeVariant(roleName: string): 'default' | 'secondary' | 'outline' {
  if (roleName === 'project:admin')
    return 'default'
  if (roleName === 'project:editor')
    return 'secondary'
  return 'outline'
}

/** 更新成员角色 */
async function handleUpdateRole(member: ProjectMember, newRoleId: string) {
  if (!props.project || member.role.id === newRoleId)
    return

  updatingMemberId.value = member.id
  try {
    const updatedMember = await projectApi.updateProjectMember(
      props.project.id,
      member.id,
      { roleId: newRoleId },
    )

    // 更新本地数据
    emits('updateRole', updatedMember)

    toast.success('角色已更新')
  }
  finally {
    updatingMemberId.value = null
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
        <Badge :variant="getRoleBadgeVariant(member.role.name)" class="shrink-0">
          {{ getRoleDisplayName(member.role.name) }}
        </Badge>
      </div>
      <p class="text-sm text-muted-foreground truncate">
        {{ member.user.email }}
      </p>
    </div>

    <!-- 操作按钮 -->
    <div v-if="isCurrentUserAdmin" class="flex items-center gap-2">
      <Select
        :model-value="member.role.id"
        :disabled="updatingMemberId === member.id"
        @update:model-value="(v) => handleUpdateRole(member, v as string)"
      >
        <SelectTrigger class="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="role in projectRoles"
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
  </div>
</template>
