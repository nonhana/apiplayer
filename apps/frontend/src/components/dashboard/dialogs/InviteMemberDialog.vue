<script lang="ts" setup>
import type { ProjectMember } from '@/types/project'
import type { RoleItem } from '@/types/role'
import type { TeamMember } from '@/types/team'
import type { UserBriefInfo } from '@/types/user'
import { Loader2 } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { computed, ref, watch, watchEffect } from 'vue'
import { toast } from 'vue-sonner'
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
}>()

const globalStore = useGlobalStore()
const { teamRoles, projectRoles } = storeToRefs(globalStore)

const isOpen = defineModel<boolean>('open', { required: true })

const isTeamMode = computed(() => props.type === 'team')

const teamMemberOptions = ref<UserBriefInfo[]>([])

// 如果当前为“邀请项目成员”模式，需要获取当前团队的成员列表
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

const selectedUsers = ref<UserBriefInfo[]>([])
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
    return teamRoles.value.find(r => r.name === ROLE_NAME.TEAM_MEMBER)!.id
  }
  return projectRoles.value.find(r => r.name === ROLE_NAME.PROJECT_VIEWER)!.id
})

const canSubmit = computed(() =>
  selectedUsers.value.length > 0 && selectedRoleId.value && !isSubmitting.value,
)

async function inviteTeamMembers() {
  return await teamApi.inviteTeamMembers(props.teamId!, {
    members: selectedUsers.value.map(user => ({
      userId: user.id,
      roleId: selectedRoleId.value,
      nickname: nickname.value || undefined,
    })),
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
    const newMembers = isTeamMode.value
      ? await inviteTeamMembers()
      : await inviteProjectMembers()

    toast.success('邀请成功', {
      description: `已邀请 ${newMembers.length} 名用户加入${typeLabel}`,
    })

    emits('invited', newMembers)

    isOpen.value = false
    resetForm()
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
  selectedRoleId.value = defaultRoleId.value
  nickname.value = ''
}

watch(isOpen, open => !open && resetForm())
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-120">
      <DialogHeader>
        <DialogTitle>邀请成员</DialogTitle>
        <DialogDescription>
          邀请新成员加入{{ isTeamMode ? '团队' : '项目' }}
          <span class="font-medium text-foreground">{{ resourceName }}</span>
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-2">
        <div class="space-y-2">
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
          邀请 {{ selectedUsers.length > 0 ? `(${selectedUsers.length})` : '' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
