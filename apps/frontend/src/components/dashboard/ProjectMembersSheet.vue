<script lang="ts" setup>
import type { ProjectItem, ProjectMember } from '@/types/project'
import type { RoleItem } from '@/types/role'
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
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { ROLE_NAME } from '@/constants/roles'
import InviteMemberDialog from './InviteMemberDialog.vue'
import MemberItem from './MemberItem.vue'

const props = defineProps<{
  project: ProjectItem
}>()

const emits = defineEmits<{
  (e: 'memberCountChanged', count: number): void
}>()

const isOpen = defineModel<boolean>('open', { required: true })

// 角色列表
const projectRoles = ref<RoleItem[]>([])

// 成员列表状态
const members = ref<ProjectMember[]>([])
const isLoading = ref(false)
const searchQuery = ref('')

// 邀请成员对话框状态
const isInviteDialogOpen = ref(false)

// 删除确认状态
const isDeleteDialogOpen = ref(false)
const memberToDelete = ref<ProjectMember | null>(null)
const isDeleting = ref(false)

/** 已有成员的用户 ID 列表，用于在邀请时排除 */
const existingMemberIds = computed(() => members.value.map(m => m.user.id))

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
const isAdmin = computed(() =>
  props.project.currentUserRole?.name === ROLE_NAME.PROJECT_ADMIN,
)

/** 获取项目角色列表 */
async function fetchProjectRoles() {
  const { roles } = await roleApi.getRoles({ type: 'PROJECT' })
  projectRoles.value = roles
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

/** 成员邀请成功 */
function handleMembersInvited(newMembers: ProjectMember[]) {
  members.value.push(...newMembers)
  emits('memberCountChanged', members.value.length)
}

/** 更新成员 */
function handleUpdateMember(member: ProjectMember) {
  members.value = members.value.map(m => m.id === member.id ? member : m)
}

/** 删除成员 */
function handleDeleteMember(member: ProjectMember) {
  memberToDelete.value = member
  isDeleteDialogOpen.value = true
}

/** 确认删除成员 */
async function confirmDeleteMember() {
  if (!memberToDelete.value)
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

watch(() => props.project, async () => {
  await Promise.all([fetchProjectRoles(), fetchMembers()])
  searchQuery.value = ''
}, { immediate: true })
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
          管理项目 <span class="font-medium text-foreground">{{ project.name }}</span> 的成员
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
            v-if="isAdmin"
            size="sm"
            @click="isInviteDialogOpen = true"
          >
            <UserPlus class="h-4 w-4 mr-1" />
            邀请
          </Button>
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
            <MemberItem
              v-for="member in filteredMembers"
              :key="member.id"
              type="project"
              :member="member"
              :project-id="project.id"
              :roles="projectRoles"
              :is-admin="isAdmin"
              @update-member="handleUpdateMember"
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

  <!-- 邀请成员对话框 -->
  <InviteMemberDialog
    v-model:open="isInviteDialogOpen"
    type="project"
    :resource-id="project.id"
    :resource-name="project.name"
    :existing-member-ids="existingMemberIds"
    @invited="handleMembersInvited"
  />

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
