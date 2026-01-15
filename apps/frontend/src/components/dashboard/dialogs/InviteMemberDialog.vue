<script lang="ts" setup>
import type { ProjectMember } from '@/types/project'
import type { RoleItem } from '@/types/role'
import type { InvitationInfo, TeamMember } from '@/types/team'
import type { UserBriefInfo } from '@/types/user'
import { SystemConfigKey, TeamInviteMode } from '@apiplayer/shared'
import { Loader2, Mail, Users } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { computed, ref, watch, watchEffect } from 'vue'
import { toast } from 'vue-sonner'
import z from 'zod'
import { projectApi } from '@/api/project'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ROLE_NAME } from '@/constants/roles'
import { useGlobalStore } from '@/stores/useGlobalStore'
import UserSearchSelect from '../UserSearchSelect.vue'

export type InviteType = 'team' | 'project'

export type MemberResult = TeamMember | ProjectMember

const props = defineProps<{
  type: InviteType
  teamId?: string
  projectId?: string
  resourceName: string
  existingMemberIds: string[]
}>()

const emits = defineEmits<{
  (e: 'invited', members: MemberResult[]): void
  (e: 'invitationSent', invitation: InvitationInfo): void
}>()

const globalStore = useGlobalStore()
const { teamRoles, projectRoles, systemConfig } = storeToRefs(globalStore)

const isOpen = defineModel<boolean>('open', { required: true })

const isTeamMode = computed(() => props.type === 'team')

/** 是否使用邮箱邀请模式（仅在团队模式下适用） */
const isEmailInviteMode = computed(() =>
  isTeamMode.value && systemConfig.value?.[SystemConfigKey.INVITE_MODE] === TeamInviteMode.EMAIL,
)

const teamMemberOptions = ref<UserBriefInfo[]>([])

// 如果当前为"邀请项目成员"模式，需要获取当前团队的成员列表
watchEffect(async () => {
  if (!isTeamMode.value) {
    if (!props.teamId) {
      console.warn('无 team id，暂无法获取团队成员列表')
      return
    }
    const teamMembers = await teamApi.getAllTeamMembers(props.teamId)
    teamMemberOptions.value = teamMembers.map(member => member.user)
  }
  else {
    teamMemberOptions.value = []
  }
})

// 直接添加模式 - 选中的用户
const selectedUsers = ref<UserBriefInfo[]>([])

// 邮箱邀请模式 - 邮箱地址
const inviteEmail = ref('')

const selectedRoleId = ref('')
const nickname = ref('')
const isSubmitting = ref(false)

const roleList = computed<RoleItem[]>(() => {
  if (isTeamMode.value) {
    return teamRoles.value.filter(r => r.name !== ROLE_NAME.TEAM_OWNER)
  }
  return projectRoles.value
})

const defaultRoleId = computed(() => {
  if (isTeamMode.value) {
    return teamRoles.value.find(r => r.name === ROLE_NAME.TEAM_MEMBER)?.id ?? ''
  }
  return projectRoles.value.find(r => r.name === ROLE_NAME.PROJECT_VIEWER)?.id ?? ''
})

/** 邮箱格式是否有效 */
const isEmailValid = computed(() =>
  z.string().email().safeParse(inviteEmail.value.trim()).success,
)

const canSubmit = computed(() => {
  if (isSubmitting.value)
    return false
  if (!selectedRoleId.value)
    return false

  if (isEmailInviteMode.value) {
    return isEmailValid.value
  }
  return selectedUsers.value.length > 0
})

// 直接添加模式 - 邀请团队成员
async function inviteTeamMembersDirect() {
  return await teamApi.inviteTeamMembers(props.teamId!, {
    members: selectedUsers.value.map(user => ({
      userId: user.id,
      roleId: selectedRoleId.value,
      nickname: nickname.value || undefined,
    })),
  })
}

// 邮箱邀请模式 - 发送邀请邮件
async function sendEmailInvitation() {
  return await teamApi.sendInvitation(props.teamId!, {
    email: inviteEmail.value.trim(),
    roleId: selectedRoleId.value,
    nickname: nickname.value || undefined,
  })
}

async function inviteProjectMembers(): Promise<ProjectMember[]> {
  return await projectApi.inviteProjectMembers(props.projectId!, {
    members: selectedUsers.value.map(user => ({
      userId: user.id,
      roleId: selectedRoleId.value,
    })),
  })
}

async function handleSubmit() {
  if (!canSubmit.value)
    return

  const typeLabel = isTeamMode.value ? '团队' : '项目'
  isSubmitting.value = true

  try {
    if (isEmailInviteMode.value) {
      // 邮箱邀请模式
      const invitation = await sendEmailInvitation()
      toast.success('邀请已发送', {
        description: `邀请邮件已发送至 ${inviteEmail.value}`,
      })
      emits('invitationSent', invitation)
      isOpen.value = false
      resetForm()
    }
    else {
      // 直接添加模式
      const newMembers = isTeamMode.value
        ? await inviteTeamMembersDirect()
        : await inviteProjectMembers()

      toast.success('邀请成功', {
        description: `已邀请 ${newMembers.length} 名用户加入${typeLabel}`,
      })

      emits('invited', newMembers)
      isOpen.value = false
      resetForm()
    }
  }
  catch (error) {
    console.error(`邀请成员加入${typeLabel}失败`, error)
  }
  finally {
    isSubmitting.value = false
  }
}

function resetForm() {
  selectedUsers.value = []
  inviteEmail.value = ''
  selectedRoleId.value = defaultRoleId.value
  nickname.value = ''
}

watch(isOpen, open => !open && resetForm())
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-120">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Mail v-if="isEmailInviteMode" class="h-5 w-5" />
          <Users v-else class="h-5 w-5" />
          邀请成员
        </DialogTitle>
        <DialogDescription>
          <template v-if="isEmailInviteMode">
            输入邮箱地址，发送邀请链接至
          </template>
          <template v-else>
            邀请新成员加入{{ isTeamMode ? '团队' : '项目' }}
          </template>
          <span class="font-medium text-foreground">{{ resourceName }}</span>
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-2">
        <div v-if="isEmailInviteMode" class="space-y-2">
          <Label class="text-sm font-medium leading-none">
            邮箱地址 <span class="text-destructive">*</span>
          </Label>
          <Input
            v-model="inviteEmail"
            type="email"
            placeholder="请输入被邀请人的邮箱地址"
            :disabled="isSubmitting"
          />
          <p v-if="inviteEmail && !isEmailValid" class="text-xs text-destructive">
            请输入有效的邮箱地址
          </p>
        </div>

        <div v-else class="space-y-2">
          <Label class="text-sm font-medium leading-none">
            选择用户 <span class="text-destructive">*</span>
          </Label>
          <UserSearchSelect
            v-model="selectedUsers"
            :exclude-ids="existingMemberIds"
            :placeholder="isTeamMode ? '搜索用户名、邮箱...' : '从团队成员中选择...'"
            :disabled="isSubmitting"
            :options="isTeamMode ? undefined : teamMemberOptions"
            :empty-text="isTeamMode ? undefined : '当前团队没有可邀请的成员'"
          />
        </div>

        <div class="space-y-2">
          <Label class="text-sm font-medium leading-none">
            分配角色 <span class="text-destructive">*</span>
          </Label>
          <Select v-model="selectedRoleId" :disabled="isSubmitting">
            <SelectTrigger>
              <SelectValue placeholder="选择角色" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="role in roleList"
                :key="role.id"
                :value="role.id"
              >
                {{ role.description || role.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div v-if="isTeamMode" class="space-y-2">
          <Label class="text-sm font-medium leading-none">
            团队昵称
          </Label>
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
          <template v-if="isEmailInviteMode">
            发送邀请
          </template>
          <template v-else>
            邀请 {{ selectedUsers.length > 0 ? `(${selectedUsers.length})` : '' }}
          </template>
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
