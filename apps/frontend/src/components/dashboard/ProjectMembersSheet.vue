<script lang="ts" setup>
import type { ProjectItem, ProjectMember } from '@/types/project'
import type { RoleItem } from '@/types/role'
import type { UserSearchItem } from '@/types/user'
import { Loader2, Search, UserPlus, Users } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { projectApi } from '@/api/project'
import { roleApi } from '@/api/role'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import ProjectMemberItem from './ProjectMemberItem.vue'
import UserSearchSelect from './UserSearchSelect.vue'

const props = defineProps<{
  project: ProjectItem | null
}>()

const emits = defineEmits<{
  (e: 'memberCountChanged', count: number): void
}>()

const isOpen = defineModel<boolean>('open', { required: true })

// 角色列表
const projectRoles = ref<RoleItem[]>([])
const isLoadingRoles = ref(false)

// 成员列表状态
const members = ref<ProjectMember[]>([])
const isLoading = ref(false)
const searchQuery = ref('')

// 邀请成员状态
const isInviting = ref(false)
const selectedUsers = ref<UserSearchItem[]>([])
const inviteRoleId = ref('')
const isInviteSubmitting = ref(false)

// 删除确认状态
const isDeleteDialogOpen = ref(false)
const memberToDelete = ref<ProjectMember | null>(null)
const isDeleting = ref(false)

/** 已有成员的用户 ID 列表，用于在搜索时排除 */
const existingMemberUserIds = computed(() => members.value.map(m => m.user.id))

/** 过滤后的成员列表 */
const filteredMembers = computed(() => {
  if (!searchQuery.value)
    return members.value
  const query = searchQuery.value.toLowerCase()
  return members.value.filter(m =>
    m.user.name.toLowerCase().includes(query)
    || m.user.email.toLowerCase().includes(query)
    || m.user.username.toLowerCase().includes(query),
  )
})

/** 当前用户是否为管理员 */
const isCurrentUserAdmin = computed(() =>
  props.project?.currentUserRole?.name === 'project:admin',
)

/** 默认角色 ID（查看者角色） */
const defaultRoleId = computed(() => {
  const viewerRole = projectRoles.value.find(r => r.name === 'project:viewer')
  return viewerRole?.id ?? ''
})

/** 获取项目角色列表 */
async function fetchProjectRoles() {
  isLoadingRoles.value = true
  try {
    const response = await roleApi.getRoles({ type: 'PROJECT' })
    projectRoles.value = response.roles
  }
  finally {
    isLoadingRoles.value = false
  }
}

/** 获取成员列表 */
async function fetchMembers() {
  if (!props.project)
    return

  isLoading.value = true
  try {
    const response = await projectApi.getProjectMembers(props.project.id, { limit: 100 })
    members.value = response.members
  }
  finally {
    isLoading.value = false
  }
}

/** 邀请成员 */
async function handleInvite() {
  if (!props.project || selectedUsers.value.length === 0 || !inviteRoleId.value)
    return

  isInviteSubmitting.value = true
  try {
    const { members: newMembers } = await projectApi.inviteProjectMembers(props.project.id, {
      members: selectedUsers.value.map(user => ({
        email: user.email,
        roleId: inviteRoleId.value,
      })),
    })

    // 更新本地成员列表
    if (newMembers.length > 0) {
      members.value.push(...newMembers)
      emits('memberCountChanged', members.value.length)
    }

    toast.success('邀请成功', {
      description: `已邀请 ${newMembers.length} 名用户加入项目`,
    })

    // 重置表单
    selectedUsers.value = []
    inviteRoleId.value = defaultRoleId.value
    isInviting.value = false
  }
  finally {
    isInviteSubmitting.value = false
  }
}

/** 更新成员角色 */
async function handleUpdateRole(member: ProjectMember) {
  // 更新本地数据
  const index = members.value.findIndex(m => m.id === member.id)
  if (index !== -1) {
    members.value[index] = member
  }
}

/** 确认删除成员 */
function handleDeleteMember(member: ProjectMember) {
  memberToDelete.value = member
  isDeleteDialogOpen.value = true
}

/** 删除成员 */
async function confirmDeleteMember() {
  if (!props.project || !memberToDelete.value)
    return

  isDeleting.value = true
  try {
    await projectApi.removeProjectMember(props.project.id, memberToDelete.value.id)

    members.value = members.value.filter(m => m.id !== memberToDelete.value?.id)
    emits('memberCountChanged', members.value.length)

    toast.success('成员已移除')

    isDeleteDialogOpen.value = false
    memberToDelete.value = null
  }
  finally {
    isDeleting.value = false
  }
}

/** 打开时获取数据 */
watch(isOpen, async (open) => {
  if (open && props.project) {
    // 并行获取角色列表和成员列表
    await Promise.all([
      fetchProjectRoles(),
      fetchMembers(),
    ])

    // 设置默认角色
    inviteRoleId.value = defaultRoleId.value

    // 重置邀请状态
    isInviting.value = false
    selectedUsers.value = []
    searchQuery.value = ''
  }
})
</script>

<template>
  <Sheet v-model:open="isOpen">
    <SheetContent class="sm:max-w-[480px] flex flex-col px-4">
      <SheetHeader>
        <SheetTitle class="flex items-center gap-2">
          <Users class="h-5 w-5" />
          成员管理
        </SheetTitle>
        <SheetDescription>
          管理项目 <span class="font-medium text-foreground">{{ project?.name }}</span> 的成员
        </SheetDescription>
      </SheetHeader>

      <div class="flex-1 flex flex-col gap-4 mt-4 overflow-hidden">
        <!-- 搜索和邀请按钮 -->
        <div class="flex items-center gap-2">
          <div class="relative flex-1">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              v-model="searchQuery"
              placeholder="搜索成员..."
              class="pl-9"
            />
          </div>
          <Button
            v-if="isCurrentUserAdmin && !isInviting"
            size="sm"
            @click="isInviting = true"
          >
            <UserPlus class="h-4 w-4 mr-1" />
            邀请
          </Button>
        </div>

        <!-- 邀请成员表单 -->
        <div v-if="isInviting" class="p-4 rounded-lg border bg-muted/30 space-y-3">
          <div class="flex items-center gap-2">
            <UserPlus class="h-4 w-4 text-muted-foreground" />
            <span class="text-sm font-medium">邀请新成员</span>
          </div>

          <!-- 用户搜索选择器 -->
          <UserSearchSelect
            v-model="selectedUsers"
            :exclude-user-ids="existingMemberUserIds"
            placeholder="搜索用户名、邮箱或昵称..."
            :disabled="isInviteSubmitting"
          />

          <!-- 角色选择 -->
          <div class="flex items-center gap-2">
            <span class="text-sm text-muted-foreground shrink-0">分配角色：</span>
            <Select v-model="inviteRoleId" :disabled="isInviteSubmitting || isLoadingRoles">
              <SelectTrigger class="flex-1">
                <SelectValue placeholder="选择角色" />
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
          </div>

          <div class="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              :disabled="isInviteSubmitting"
              @click="isInviting = false; selectedUsers = []"
            >
              取消
            </Button>
            <Button
              size="sm"
              :disabled="selectedUsers.length === 0 || !inviteRoleId || isInviteSubmitting"
              @click="handleInvite"
            >
              <Loader2 v-if="isInviteSubmitting" class="h-4 w-4 mr-1 animate-spin" />
              邀请 {{ selectedUsers.length > 0 ? `(${selectedUsers.length})` : '' }}
            </Button>
          </div>
        </div>

        <Separator />

        <!-- 成员列表 -->
        <ScrollArea class="flex-1 -mx-6 px-6">
          <!-- 加载状态 -->
          <div v-if="isLoading" class="space-y-3">
            <div v-for="i in 5" :key="i" class="flex items-center gap-3 p-3 rounded-lg">
              <Skeleton class="h-10 w-10 rounded-full" />
              <div class="flex-1 space-y-1.5">
                <Skeleton class="h-4 w-24" />
                <Skeleton class="h-3 w-32" />
              </div>
              <Skeleton class="h-6 w-16" />
            </div>
          </div>

          <!-- 成员列表 -->
          <div v-else class="space-y-2">
            <ProjectMemberItem
              v-for="member in filteredMembers"
              :key="member.id"
              :project="project"
              :member="member"
              :project-roles="projectRoles"
              :is-current-user-admin="isCurrentUserAdmin"
              @update-role="handleUpdateRole"
              @delete-member="handleDeleteMember"
            />

            <!-- 空状态 -->
            <div
              v-if="filteredMembers.length === 0 && !isLoading"
              class="py-8 text-center text-muted-foreground"
            >
              {{ searchQuery ? '没有找到匹配的成员' : '暂无成员' }}
            </div>
          </div>
        </ScrollArea>

        <!-- 成员统计 -->
        <div class="text-xs text-muted-foreground text-center pt-2 border-t">
          共 {{ members.length }} 名成员
        </div>
      </div>
    </SheetContent>
  </Sheet>

  <!-- 删除确认对话框 -->
  <AlertDialog v-model:open="isDeleteDialogOpen">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>移除成员</AlertDialogTitle>
        <AlertDialogDescription>
          确定要将 <span class="font-medium text-foreground">{{ memberToDelete?.user.name }}</span> 从项目中移除吗？
          此操作不可撤销。
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel :disabled="isDeleting">
          取消
        </AlertDialogCancel>
        <AlertDialogAction
          :disabled="isDeleting"
          class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          @click.prevent="confirmDeleteMember"
        >
          <Loader2 v-if="isDeleting" class="h-4 w-4 mr-1 animate-spin" />
          确认移除
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
