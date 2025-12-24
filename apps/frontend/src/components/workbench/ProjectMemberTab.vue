<script lang="ts" setup>
import type { ProjectDetail, ProjectMember } from '@/types/project'
import {
  Loader2,
  Search,
  UserPlus,
} from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { projectApi } from '@/api/project'
import InviteMemberDialog from '@/components/dashboard/InviteMemberDialog.vue'
import MemberItem from '@/components/dashboard/MemberItem.vue'
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
import { TabsContent } from '@/components/ui/tabs'
import { useGlobalStore } from '@/stores/useGlobalStore'
import { useProjectStore } from '@/stores/useProjectStore'

const props = defineProps<{
  project: ProjectDetail
  isAdmin: boolean
}>()

const globalStore = useGlobalStore()
const projectStore = useProjectStore()

const { projectRoles } = storeToRefs(globalStore)
const { projectMembers: members } = storeToRefs(projectStore)

// 成员管理状态
const memberSearchQuery = ref('')

// 邀请成员对话框
const isInviteDialogOpen = ref(false)

// 删除成员确认
const isDeleteMemberDialogOpen = ref(false)
const memberToDelete = ref<ProjectMember | null>(null)
const isDeletingMember = ref(false)

/** 已有成员的用户 ID 列表 */
const existingMemberIds = computed(() => members.value.map(m => m.user.id))

/** 过滤后的成员列表 */
const filteredMembers = computed(() => {
  if (!memberSearchQuery.value)
    return members.value
  const query = memberSearchQuery.value.toLowerCase()
  return members.value.filter(m =>
    m.user.name.toLowerCase().includes(query)
    || m.user.email.toLowerCase().includes(query)
    || m.user.username.toLowerCase().includes(query),
  )
})

/** 更新成员 */
function handleUpdateMember(member: ProjectMember) {
  members.value = members.value.map(m => m.id === member.id ? member : m)
  // 同步更新 store
  projectStore.setProjectMembers(members.value)
}

/** 打开删除成员确认 */
function handleDeleteMember(member: ProjectMember) {
  memberToDelete.value = member
  isDeleteMemberDialogOpen.value = true
}

/** 确认删除成员 */
async function confirmDeleteMember() {
  if (!memberToDelete.value)
    return

  isDeletingMember.value = true
  try {
    await projectApi.removeProjectMember(props.project.id, memberToDelete.value.id)

    members.value = members.value.filter(m => m.id !== memberToDelete.value?.id)

    // 同步更新 store
    projectStore.setProjectMembers(members.value)

    toast.success('成员已移除')

    isDeleteMemberDialogOpen.value = false
    memberToDelete.value = null
  }
  finally {
    isDeletingMember.value = false
  }
}

/** 成员邀请成功 */
function handleMembersInvited(newMembers: ProjectMember[]) {
  members.value.push(...newMembers)
  // 同步更新 store
  projectStore.setProjectMembers(members.value)
}

watch(() => props.project, async () => {
  memberSearchQuery.value = ''
}, { immediate: true })
</script>

<template>
  <!-- 成员管理 Tab -->
  <TabsContent value="members" force-mount class="flex-1 flex flex-col overflow-hidden px-6 py-4 data-[state=inactive]:hidden">
    <!-- 搜索和邀请 -->
    <div class="flex items-center gap-2 mb-4">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          v-model="memberSearchQuery"
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

    <!-- 成员列表 -->
    <ScrollArea class="flex-1 -mx-6 px-6">
      <div class="space-y-2">
        <MemberItem
          v-for="member in filteredMembers"
          :key="member.id"
          type="project"
          :project-id="project.id"
          :member="member"
          :roles="projectRoles"
          :is-admin="isAdmin"
          @update-member="handleUpdateMember"
          @delete-member="handleDeleteMember"
        />

        <!-- 空状态 -->
        <div
          v-if="filteredMembers.length === 0"
          class="py-8 text-center text-muted-foreground"
        >
          {{ memberSearchQuery ? '没有找到匹配的成员' : '暂无成员' }}
        </div>
      </div>
    </ScrollArea>

    <!-- 成员统计 -->
    <div class="text-xs text-muted-foreground text-center pt-4 border-t mt-4">
      共 {{ members.length }} 名成员
    </div>

    <!-- 邀请成员对话框 -->
    <InviteMemberDialog
      v-model:open="isInviteDialogOpen"
      type="project"
      :team-id="project.team.id"
      :project-id="project.id"
      :resource-name="project.name"
      :existing-member-ids="existingMemberIds"
      @invited="handleMembersInvited"
    />

    <!-- 删除成员确认 -->
    <AlertDialog v-model:open="isDeleteMemberDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>移除成员</AlertDialogTitle>
          <AlertDialogDescription>
            确定要将 <span class="font-medium text-foreground">{{ memberToDelete?.user.name }}</span> 从项目中移除吗？
            此操作不可撤销。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="isDeletingMember">
            取消
          </AlertDialogCancel>
          <AlertDialogAction
            :disabled="isDeletingMember"
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            @click.prevent="confirmDeleteMember"
          >
            <Loader2 v-if="isDeletingMember" class="h-4 w-4 mr-2 animate-spin" />
            确认移除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </TabsContent>
</template>
