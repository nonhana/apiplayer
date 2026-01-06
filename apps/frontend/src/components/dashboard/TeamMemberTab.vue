<script lang="ts" setup>
import type { TeamItem, TeamMember } from '@/types/team'
import {
  Loader2,
  Search,
  UserPlus,
} from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { teamApi } from '@/api/team'
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
import { Skeleton } from '@/components/ui/skeleton'
import { TabsContent } from '@/components/ui/tabs'
import { useTeamStore } from '@/stores/useTeamStore'
import InviteMemberDialog from './dialogs/InviteMemberDialog.vue'
import MemberItem from './MemberItem.vue'

const props = defineProps<{
  team: TeamItem
  isAdmin: boolean
  isOwner: boolean
}>()

const teamStore = useTeamStore()

const members = ref<TeamMember[]>([])
const isLoadingMembers = ref(false)
const memberSearchQuery = ref('')

const isInviteDialogOpen = ref(false)

const isDeleteMemberDialogOpen = ref(false)
const memberToDelete = ref<TeamMember | null>(null)
const isDeletingMember = ref(false)

const existingMemberIds = computed(() => members.value.map(m => m.user.id))

const filteredMembers = computed(() => {
  if (!memberSearchQuery.value)
    return members.value
  const query = memberSearchQuery.value.toLowerCase()
  return members.value.filter(m =>
    m.user.name.toLowerCase().includes(query)
    || m.user.email.toLowerCase().includes(query)
    || m.user.username.toLowerCase().includes(query)
    || m.nickname?.toLowerCase().includes(query),
  )
})

async function fetchMembers() {
  isLoadingMembers.value = true
  try {
    members.value = await teamApi.getAllTeamMembers(props.team.id)
  }
  catch (error) {
    console.error('获取团队成员失败', error)
  }
  finally {
    isLoadingMembers.value = false
  }
}

function handleUpdateMember(member: TeamMember) {
  members.value = members.value.map(m => m.id === member.id ? member : m)
}

function handleDeleteMember(member: TeamMember) {
  memberToDelete.value = member
  isDeleteMemberDialogOpen.value = true
}

async function confirmDeleteMember() {
  if (!memberToDelete.value)
    return

  isDeletingMember.value = true
  try {
    await teamApi.removeTeamMember(props.team.id, memberToDelete.value.id)

    members.value = members.value.filter(m => m.id !== memberToDelete.value?.id)

    // 更新 store 中的成员数量
    teamStore.updateTeam(props.team.id, {
      memberCount: members.value.length,
    })

    toast.success('成员已移除')

    isDeleteMemberDialogOpen.value = false
    memberToDelete.value = null
  }
  catch (error) {
    console.error('删除成员失败', error)
  }
  finally {
    isDeletingMember.value = false
  }
}

function handleMembersInvited(newMembers: TeamMember[]) {
  members.value.push(...newMembers)

  // 更新 store 中的成员数量
  teamStore.updateTeam(props.team.id, {
    memberCount: members.value.length,
  })
}

watch(() => props.team, () => {
  fetchMembers()
  memberSearchQuery.value = ''
}, { immediate: true })
</script>

<template>
  <TabsContent value="members" force-mount class="flex-1 flex flex-col overflow-hidden px-6 py-4 data-[state=inactive]:hidden">
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

    <ScrollArea class="flex-1 -mx-6 px-6">
      <div v-if="isLoadingMembers" class="space-y-3">
        <div v-for="i in 5" :key="i" class="flex items-center gap-3 p-3 rounded-lg">
          <Skeleton class="h-10 w-10 rounded-full" />
          <div class="flex-1 space-y-1.5">
            <Skeleton class="h-4 w-24" />
            <Skeleton class="h-3 w-32" />
          </div>
          <Skeleton class="h-6 w-16" />
        </div>
      </div>

      <div v-else class="space-y-2">
        <MemberItem
          v-for="member in filteredMembers"
          :key="member.id"
          type="team"
          :team-id="team.id"
          :member="member"
          :is-admin="isAdmin"
          :is-owner="isOwner"
          @update-member="handleUpdateMember"
          @delete-member="handleDeleteMember"
        />

        <div
          v-if="filteredMembers.length === 0 && !isLoadingMembers"
          class="py-8 text-center text-muted-foreground"
        >
          {{ memberSearchQuery ? '没有找到匹配的成员' : '暂无成员' }}
        </div>
      </div>
    </ScrollArea>

    <div class="text-xs text-muted-foreground text-center pt-4 border-t mt-4">
      共 {{ members.length }} 名成员
    </div>

    <InviteMemberDialog
      v-model:open="isInviteDialogOpen"
      type="team"
      :team-id="team.id"
      :resource-name="team.name"
      :existing-member-ids="existingMemberIds"
      @invited="handleMembersInvited"
    />

    <AlertDialog v-model:open="isDeleteMemberDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>移除成员</AlertDialogTitle>
          <AlertDialogDescription>
            确定要将 <span class="font-medium text-foreground">{{ memberToDelete?.user.name }}</span> 从团队中移除吗？
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
