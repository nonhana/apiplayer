<script lang="ts" setup>
import type { RoleItem } from '@/types/role'
import type { TeamMember } from '@/types/team'
import type { UserSearchItem } from '@/types/user'
import { Loader2 } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
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

const props = defineProps<{
  teamId: string
  teamName: string
  /** 已有成员的用户 ID 列表，用于排除 */
  existingMemberIds: string[]
}>()

const emits = defineEmits<{
  (e: 'invited', members: TeamMember[]): void
}>()

const isOpen = defineModel<boolean>('open', { required: true })

// 表单状态
const selectedUsers = ref<UserSearchItem[]>([])
const selectedRoleId = ref('')
const nickname = ref('')
const isSubmitting = ref(false)

// 角色列表
const teamRoles = ref<RoleItem[]>([])
const isLoadingRoles = ref(false)

/** 可选角色列表（排除 Owner） */
const selectableRoles = computed(() =>
  teamRoles.value.filter(r => r.name !== ROLE_NAME.TEAM_OWNER),
)

/** 默认角色 ID（团队成员） */
const defaultRoleId = computed(() => {
  const memberRole = teamRoles.value.find(r => r.name === ROLE_NAME.TEAM_MEMBER)
  return memberRole?.id ?? ''
})

/** 是否可以提交 */
const canSubmit = computed(() =>
  selectedUsers.value.length > 0 && selectedRoleId.value && !isSubmitting.value,
)

/** 获取团队角色列表 */
async function fetchTeamRoles() {
  isLoadingRoles.value = true
  try {
    const response = await roleApi.getRoles({ type: 'TEAM' })
    teamRoles.value = response.roles
    // 设置默认角色
    if (!selectedRoleId.value) {
      selectedRoleId.value = defaultRoleId.value
    }
  }
  finally {
    isLoadingRoles.value = false
  }
}

/** 提交邀请 */
async function handleSubmit() {
  if (!canSubmit.value)
    return

  isSubmitting.value = true
  try {
    const { members: newMembers } = await teamApi.inviteTeamMembers(props.teamId, {
      members: selectedUsers.value.map(user => ({
        email: user.email,
        roleId: selectedRoleId.value,
        nickname: nickname.value || undefined,
      })),
    })

    toast.success('邀请成功', {
      description: `已邀请 ${newMembers.length} 名用户加入团队`,
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
  selectedUsers.value = []
  selectedRoleId.value = defaultRoleId.value
  nickname.value = ''
}

/** 打开时获取角色列表 */
watch(isOpen, async (open) => {
  if (open) {
    await fetchTeamRoles()
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
          邀请新成员加入团队 <span class="font-medium text-foreground">{{ teamName }}</span>
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-2">
        <!-- 用户搜索选择 -->
        <div class="space-y-2">
          <label class="text-sm font-medium leading-none">
            选择用户 <span class="text-destructive">*</span>
          </label>
          <UserSearchSelect
            v-model="selectedUsers"
            :exclude-user-ids="existingMemberIds"
            placeholder="搜索用户名、邮箱或昵称..."
            :disabled="isSubmitting"
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

        <!-- 团队内昵称（可选） -->
        <div class="space-y-2">
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
