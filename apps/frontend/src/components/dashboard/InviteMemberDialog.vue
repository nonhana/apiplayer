<script lang="ts" setup>
import type { ProjectMember } from '@/types/project'
import type { RoleItem } from '@/types/role'
import type { TeamMember } from '@/types/team'
import type { UserSearchItem } from '@/types/user'
import { Loader2 } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { projectApi } from '@/api/project'
import { roleApi } from '@/api/role'
import { teamApi } from '@/api/team'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ROLE_NAME } from '@/constants/roles'
import UserSearchSelect from './UserSearchSelect.vue'

/** 邀请类型 */
export type InviteType = 'team' | 'project'

/** 通用的成员类型 */
export type MemberResult = TeamMember | ProjectMember

const props = defineProps<{
  /** 邀请类型：team 或 project */
  type: InviteType
  /** 资源 ID（teamId 或 projectId） */
  resourceId: string
  /** 资源名称（团队名或项目名） */
  resourceName: string
  /** 已有成员的用户 ID 列表，用于在搜索时排除 */
  existingMemberIds: string[]
}>()

const emits = defineEmits<{
  (e: 'invited', members: MemberResult[]): void
}>()

const isOpen = defineModel<boolean>('open', { required: true })

// 是否为团队模式
const isTeamMode = computed(() => props.type === 'team')

// 表单状态
const selectedUserIds = ref<string[]>([])
const selectedUsers = ref<UserSearchItem[]>([])
const selectedRoleId = ref('')
const nickname = ref('')
const isSubmitting = ref(false)

/** 处理用户选择变化 */
function handleUsersChange(users: UserSearchItem[]) {
  selectedUsers.value = users
}

// 角色列表
const roles = ref<RoleItem[]>([])
const isLoadingRoles = ref(false)

/** 可选角色列表（Team 模式下排除 Owner） */
const selectableRoles = computed(() => {
  if (isTeamMode.value) {
    return roles.value.filter(r => r.name !== ROLE_NAME.TEAM_OWNER)
  }
  return roles.value
})

/** 默认角色 ID */
const defaultRoleId = computed(() => {
  if (isTeamMode.value) {
    const memberRole = roles.value.find(r => r.name === ROLE_NAME.TEAM_MEMBER)
    return memberRole?.id ?? ''
  }
  // Project 模式默认是 viewer
  const viewerRole = roles.value.find(r => r.name === 'project:viewer')
  return viewerRole?.id ?? ''
})

/** 是否可以提交 */
const canSubmit = computed(() =>
  selectedUsers.value.length > 0 && selectedRoleId.value && !isSubmitting.value,
)

/** 获取角色列表 */
async function fetchRoles() {
  isLoadingRoles.value = true
  try {
    const response = await roleApi.getRoles({
      type: isTeamMode.value ? 'TEAM' : 'PROJECT',
    })
    roles.value = response.roles
    // 设置默认角色
    if (!selectedRoleId.value) {
      selectedRoleId.value = defaultRoleId.value
    }
  }
  finally {
    isLoadingRoles.value = false
  }
}

/** 邀请团队成员 */
async function inviteTeamMembers(): Promise<TeamMember[]> {
  return await teamApi.inviteTeamMembers(props.resourceId, {
    members: selectedUsers.value.map(user => ({
      email: user.email,
      roleId: selectedRoleId.value,
      nickname: nickname.value || undefined,
    })),
  })
}

/** 邀请项目成员 */
async function inviteProjectMembers(): Promise<ProjectMember[]> {
  return await projectApi.inviteProjectMembers(props.resourceId, {
    members: selectedUsers.value.map(user => ({
      email: user.email,
      roleId: selectedRoleId.value,
    })),
  })
}

/** 提交邀请 */
async function handleSubmit() {
  if (!canSubmit.value)
    return

  isSubmitting.value = true
  try {
    const newMembers = isTeamMode.value
      ? await inviteTeamMembers()
      : await inviteProjectMembers()

    const typeLabel = isTeamMode.value ? '团队' : '项目'
    toast.success('邀请成功', {
      description: `已邀请 ${newMembers.length} 名用户加入${typeLabel}`,
    })

    emits('invited', newMembers)

    isOpen.value = false
    resetForm()
  }
  finally {
    isSubmitting.value = false
  }
}

/** 重置表单 */
function resetForm() {
  selectedUserIds.value = []
  selectedUsers.value = []
  selectedRoleId.value = defaultRoleId.value
  nickname.value = ''
}

/** 打开时获取角色列表 */
watch(isOpen, async (open) => {
  if (open) {
    await fetchRoles()
  }
  else {
    resetForm()
  }
})
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-[480px]">
      <DialogHeader>
        <DialogTitle>邀请成员</DialogTitle>
        <DialogDescription>
          邀请新成员加入{{ isTeamMode ? '团队' : '项目' }}
          <span class="font-medium text-foreground">{{ resourceName }}</span>
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-2">
        <!-- 用户搜索选择 -->
        <div class="space-y-2">
          <label class="text-sm font-medium leading-none">
            选择用户 <span class="text-destructive">*</span>
          </label>
          <UserSearchSelect
            v-model="selectedUserIds"
            :exclude-user-ids="existingMemberIds"
            placeholder="搜索用户名、邮箱或昵称..."
            :disabled="isSubmitting"
            @change="handleUsersChange"
          />
        </div>

        <!-- 角色选择 -->
        <div class="space-y-2">
          <label class="text-sm font-medium leading-none">
            分配角色 <span class="text-destructive">*</span>
          </label>
          <Select v-model="selectedRoleId" :disabled="isSubmitting || isLoadingRoles">
            <SelectTrigger>
              <SelectValue placeholder="选择角色" />
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
        </div>

        <!-- 团队内昵称（仅团队模式可用） -->
        <div v-if="isTeamMode" class="space-y-2">
          <label class="text-sm font-medium leading-none">
            团队昵称
          </label>
          <Input
            v-model="nickname"
            placeholder="成员在团队内的昵称（可选）"
            :disabled="isSubmitting"
          />
        </div>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          :disabled="isSubmitting"
          @click="isOpen = false"
        >
          取消
        </Button>
        <Button
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          <Loader2 v-if="isSubmitting" class="h-4 w-4 mr-2 animate-spin" />
          邀请 {{ selectedUsers.length > 0 ? `(${selectedUsers.length})` : '' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
