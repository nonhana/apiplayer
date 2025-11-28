<script lang="ts" setup>
import type { ProjectItem, ProjectMember } from '@/types/project'
import { Loader2, Mail, Search, Trash2, UserPlus, Users } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { projectApi } from '@/api/project'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
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

const props = defineProps<{
  project: ProjectItem | null
}>()

const emits = defineEmits<{
  (e: 'memberCountChanged', count: number): void
}>()

/** 项目角色列表（硬编码，实际应该从后端获取） */
const PROJECT_ROLES = [
  { id: 'project:admin', name: '管理员', description: '拥有所有权限' },
  { id: 'project:editor', name: '编辑者', description: '可编辑 API' },
  { id: 'project:viewer', name: '查看者', description: '只读权限' },
]

const isOpen = defineModel<boolean>('open', { required: true })

// 成员列表状态
const members = ref<ProjectMember[]>([])
const isLoading = ref(false)
const searchQuery = ref('')

// 邀请成员状态
const isInviting = ref(false)
const inviteEmail = ref('')
const inviteRoleId = ref('project:viewer')
const isInviteSubmitting = ref(false)

// 删除确认状态
const isDeleteDialogOpen = ref(false)
const memberToDelete = ref<ProjectMember | null>(null)
const isDeleting = ref(false)

// 角色更新状态
const updatingMemberId = ref<string | null>(null)

/** 获取用户头像 Fallback */
function getAvatarInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1)
    return (parts[0]?.charAt(0) ?? 'U').toUpperCase()
  return ((parts[0]?.charAt(0) ?? '') + (parts[1]?.charAt(0) ?? '')).toUpperCase() || 'U'
}

/** 角色显示名称 */
function getRoleDisplayName(roleName: string) {
  const role = PROJECT_ROLES.find(r => r.id === roleName)
  return role?.name ?? roleName
}

/** 角色徽章颜色 */
function getRoleBadgeVariant(roleName: string): 'default' | 'secondary' | 'outline' {
  if (roleName === 'project:admin')
    return 'default'
  if (roleName === 'project:editor')
    return 'secondary'
  return 'outline'
}

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
  if (!props.project || !inviteEmail.value.trim())
    return

  isInviteSubmitting.value = true
  try {
    const newMember = await projectApi.inviteProjectMember(props.project.id, {
      email: inviteEmail.value.trim(),
      roleId: inviteRoleId.value,
    })

    members.value.push(newMember)
    emits('memberCountChanged', members.value.length)

    toast.success('邀请成功', {
      description: `已邀请 ${newMember.user.name} 加入项目`,
    })

    // 重置表单
    inviteEmail.value = ''
    inviteRoleId.value = 'project:viewer'
    isInviting.value = false
  }
  finally {
    isInviteSubmitting.value = false
  }
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
    const index = members.value.findIndex(m => m.id === member.id)
    if (index !== -1) {
      members.value[index] = updatedMember
    }

    toast.success('角色已更新')
  }
  finally {
    updatingMemberId.value = null
  }
}

/** 确认删除成员 */
function confirmDeleteMember(member: ProjectMember) {
  memberToDelete.value = member
  isDeleteDialogOpen.value = true
}

/** 删除成员 */
async function handleDeleteMember() {
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

/** 打开时获取成员列表 */
watch(isOpen, (open) => {
  if (open && props.project) {
    fetchMembers()
    // 重置邀请状态
    isInviting.value = false
    inviteEmail.value = ''
    inviteRoleId.value = 'project:viewer'
    searchQuery.value = ''
  }
})
</script>

<template>
  <Sheet v-model:open="isOpen">
    <SheetContent class="sm:max-w-[480px] flex flex-col">
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
            <Mail class="h-4 w-4 text-muted-foreground" />
            <span class="text-sm font-medium">邀请新成员</span>
          </div>
          <div class="flex gap-2">
            <Input
              v-model="inviteEmail"
              type="email"
              placeholder="输入邮箱地址"
              class="flex-1"
              :disabled="isInviteSubmitting"
            />
            <Select v-model="inviteRoleId" :disabled="isInviteSubmitting">
              <SelectTrigger class="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="role in PROJECT_ROLES"
                  :key="role.id"
                  :value="role.id"
                >
                  {{ role.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              :disabled="isInviteSubmitting"
              @click="isInviting = false"
            >
              取消
            </Button>
            <Button
              size="sm"
              :disabled="!inviteEmail.trim() || isInviteSubmitting"
              @click="handleInvite"
            >
              <Loader2 v-if="isInviteSubmitting" class="h-4 w-4 mr-1 animate-spin" />
              发送邀请
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
            <div
              v-for="member in filteredMembers"
              :key="member.id"
              class="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <Avatar class="h-10 w-10 border">
                <AvatarImage v-if="member.user.avatar" :src="member.user.avatar" />
                <AvatarFallback class="text-sm font-medium">
                  {{ getAvatarInitials(member.user.name) }}
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
              <div v-if="isCurrentUserAdmin" class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Select
                  :model-value="member.role.name"
                  :disabled="updatingMemberId === member.id"
                  @update:model-value="(v) => handleUpdateRole(member, v as string)"
                >
                  <SelectTrigger class="w-[100px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="role in PROJECT_ROLES"
                      :key="role.id"
                      :value="role.id"
                    >
                      {{ role.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  @click="confirmDeleteMember(member)"
                >
                  <Trash2 class="h-4 w-4" />
                </Button>
              </div>
            </div>

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
          @click.prevent="handleDeleteMember"
        >
          <Loader2 v-if="isDeleting" class="h-4 w-4 mr-1 animate-spin" />
          确认移除
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
