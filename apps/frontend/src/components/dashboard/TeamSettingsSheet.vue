<script lang="ts" setup>
import type { RoleItem } from '@/types/role'
import type { TeamItem, TeamMember } from '@/types/team'
import {
  ImagePlus,
  Loader2,
  Search,
  Settings,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { roleApi } from '@/api/role'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { ROLE_NAME } from '@/constants/roles'
import { getTeamFallbackIcon } from '@/lib/utils'
import { useTeamStore } from '@/stores/useTeamStore'
import { updateTeamFormSchema } from '@/validators/team'
import Cropper from '../user-profile/Cropper.vue'
import DeleteTeamDialog from './DeleteTeamDialog.vue'
import InviteTeamMemberDialog from './InviteTeamMemberDialog.vue'
import TeamMemberItem from './TeamMemberItem.vue'

const props = defineProps<{
  team: TeamItem | null
}>()

const emits = defineEmits<{
  (e: 'updated', team: TeamItem): void
  (e: 'deleted', teamId: string): void
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const teamStore = useTeamStore()

// Tab 状态
const activeTab = ref('info')

// 团队信息编辑状态
const isUpdating = ref(false)

// 头像上传状态
const avatarInputRef = ref<HTMLInputElement | null>(null)
const cropperOpen = ref(false)
const cropperSourceUrl = ref<string | null>(null)

// 成员管理状态
const members = ref<TeamMember[]>([])
const isLoadingMembers = ref(false)
const memberSearchQuery = ref('')
const teamRoles = ref<RoleItem[]>([])
const isLoadingRoles = ref(false)

// 邀请成员对话框
const isInviteDialogOpen = ref(false)

// 删除团队对话框
const isDeleteTeamDialogOpen = ref(false)

// 删除成员确认
const isDeleteMemberDialogOpen = ref(false)
const memberToDelete = ref<TeamMember | null>(null)
const isDeletingMember = ref(false)

// 表单
const { handleSubmit, resetForm, setValues, values } = useForm({
  validationSchema: updateTeamFormSchema,
  initialValues: {
    name: '',
    description: '',
    avatar: '',
  },
})

/** 当前用户是否为管理员（owner 或 admin） */
const isCurrentUserAdmin = computed(() => {
  const roleName = props.team?.currentUserRole?.name
  return roleName === ROLE_NAME.TEAM_OWNER || roleName === ROLE_NAME.TEAM_ADMIN
})

/** 当前用户是否为所有者 */
const isCurrentUserOwner = computed(() =>
  props.team?.currentUserRole?.name === ROLE_NAME.TEAM_OWNER,
)

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
    || m.user.username.toLowerCase().includes(query)
    || m.nickname?.toLowerCase().includes(query),
  )
})

/** 获取团队角色列表 */
async function fetchTeamRoles() {
  isLoadingRoles.value = true
  try {
    const response = await roleApi.getRoles({ type: 'TEAM' })
    teamRoles.value = response.roles
  }
  finally {
    isLoadingRoles.value = false
  }
}

/** 获取团队成员列表 */
async function fetchMembers() {
  if (!props.team)
    return

  isLoadingMembers.value = true
  try {
    const response = await teamApi.getTeamMembers(props.team.id, { limit: 100 })
    members.value = response.members
  }
  finally {
    isLoadingMembers.value = false
  }
}

/** 提交团队信息更新 */
const onSubmit = handleSubmit(async (formValues) => {
  if (!props.team)
    return

  isUpdating.value = true
  try {
    const updatedTeam = await teamApi.updateTeam(props.team.id, {
      name: formValues.name || undefined,
      description: formValues.description || undefined,
      avatar: formValues.avatar || undefined,
    })

    // 更新 store 中的团队信息
    const teamItem: TeamItem = {
      ...props.team,
      ...updatedTeam,
    }
    teamStore.updateTeam(teamItem.id, teamItem)
    emits('updated', teamItem)

    toast.success('团队信息已更新')
  }
  finally {
    isUpdating.value = false
  }
})

/** 处理头像选择 */
function handleAvatarSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file)
    return

  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    toast.error('请选择图片文件')
    return
  }

  // 读取文件并打开裁剪器
  const reader = new FileReader()
  reader.onload = (e) => {
    cropperSourceUrl.value = e.target?.result as string
    cropperOpen.value = true
  }
  reader.readAsDataURL(file)

  // 清空 input 以便下次选择同一文件
  input.value = ''
}

/** 裁剪确认后更新头像 */
function handleAvatarCropped(url: string) {
  setValues({ ...values, avatar: url })
}

/** 成员角色更新 */
function handleMemberRoleUpdated(member: TeamMember) {
  const index = members.value.findIndex(m => m.id === member.id)
  if (index !== -1) {
    members.value[index] = member
  }
}

/** 打开删除成员确认 */
function handleDeleteMember(member: TeamMember) {
  memberToDelete.value = member
  isDeleteMemberDialogOpen.value = true
}

/** 确认删除成员 */
async function confirmDeleteMember() {
  if (!props.team || !memberToDelete.value)
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
  finally {
    isDeletingMember.value = false
  }
}

/** 成员邀请成功 */
function handleMemberInvited(member: TeamMember) {
  members.value.push(member)

  // 更新 store 中的成员数量
  if (props.team) {
    teamStore.updateTeam(props.team.id, {
      memberCount: members.value.length,
    })
  }
}

/** 团队删除成功 */
function handleTeamDeleted(teamId: string) {
  emits('deleted', teamId)
  isOpen.value = false
}

/** 打开时初始化数据 */
watch(isOpen, async (open) => {
  if (open && props.team) {
    // 设置表单初始值
    setValues({
      name: props.team.name,
      description: props.team.description ?? '',
      avatar: props.team.avatar ?? '',
    })

    // 并行获取数据
    await Promise.all([
      fetchTeamRoles(),
      fetchMembers(),
    ])

    // 重置状态
    activeTab.value = 'info'
    memberSearchQuery.value = ''
  }
  else {
    resetForm()
    members.value = []
    memberSearchQuery.value = ''
  }
})
</script>

<template>
  <Sheet v-model:open="isOpen">
    <SheetContent class="sm:max-w-[540px] flex flex-col p-0">
      <SheetHeader class="px-6 pt-6 pb-4">
        <div class="flex items-center gap-3">
          <Avatar class="h-12 w-12 border-2">
            <AvatarImage v-if="team?.avatar" :src="team.avatar" />
            <AvatarFallback class="text-lg font-semibold bg-primary/10 text-primary">
              {{ team ? getTeamFallbackIcon(team.name) : 'T' }}
            </AvatarFallback>
          </Avatar>
          <div>
            <SheetTitle class="text-lg">
              {{ team?.name ?? '团队设置' }}
            </SheetTitle>
            <SheetDescription>
              管理团队信息和成员
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <Tabs v-model="activeTab" class="flex-1 flex flex-col overflow-hidden">
        <TabsList class="mx-6 grid w-auto grid-cols-2">
          <TabsTrigger value="info" class="gap-2">
            <Settings class="h-4 w-4" />
            基本信息
          </TabsTrigger>
          <TabsTrigger value="members" class="gap-2">
            <Users class="h-4 w-4" />
            成员管理
            <span class="ml-1 text-xs text-muted-foreground">
              ({{ team?.memberCount ?? 0 }})
            </span>
          </TabsTrigger>
        </TabsList>

        <!-- 基本信息 Tab -->
        <TabsContent value="info" class="flex-1 overflow-auto px-6 py-4">
          <form class="space-y-6" @submit="onSubmit">
            <!-- 头像上传 -->
            <FormField name="avatar">
              <FormItem>
                <FormLabel>团队头像</FormLabel>
                <FormControl>
                  <div class="flex items-center gap-4">
                    <Avatar class="h-20 w-20 border-2">
                      <AvatarImage v-if="values.avatar" :src="values.avatar" />
                      <AvatarFallback class="text-2xl font-semibold bg-primary/10 text-primary">
                        {{ team ? getTeamFallbackIcon(team.name) : 'T' }}
                      </AvatarFallback>
                    </Avatar>
                    <div class="space-y-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        :disabled="isUpdating || !isCurrentUserAdmin"
                        @click="avatarInputRef?.click()"
                      >
                        <ImagePlus class="h-4 w-4 mr-2" />
                        更换头像
                      </Button>
                      <p class="text-xs text-muted-foreground">
                        支持 JPG、PNG、WebP 格式
                      </p>
                    </div>
                    <input
                      ref="avatarInputRef"
                      type="file"
                      accept="image/*"
                      class="hidden"
                      @change="handleAvatarSelect"
                    >
                  </div>
                </FormControl>
              </FormItem>
            </FormField>

            <!-- 团队名称 -->
            <FormField v-slot="{ componentField }" name="name">
              <FormItem>
                <FormLabel>团队名称</FormLabel>
                <FormControl>
                  <Input
                    placeholder="输入团队名称"
                    :disabled="isUpdating || !isCurrentUserAdmin"
                    v-bind="componentField"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <!-- 团队描述 -->
            <FormField v-slot="{ componentField }" name="description">
              <FormItem>
                <FormLabel>团队描述</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="简要描述您的团队..."
                    rows="3"
                    :disabled="isUpdating || !isCurrentUserAdmin"
                    v-bind="componentField"
                  />
                </FormControl>
                <FormDescription>
                  简短介绍团队的目标和职能
                </FormDescription>
                <FormMessage />
              </FormItem>
            </FormField>

            <!-- 保存按钮 -->
            <div v-if="isCurrentUserAdmin" class="flex justify-end">
              <Button type="submit" :disabled="isUpdating">
                <Loader2 v-if="isUpdating" class="h-4 w-4 mr-2 animate-spin" />
                保存更改
              </Button>
            </div>

            <Separator class="my-6" />

            <!-- 危险操作区 -->
            <div v-if="isCurrentUserOwner" class="space-y-4">
              <div>
                <h3 class="text-sm font-medium text-destructive">
                  危险操作
                </h3>
                <p class="text-sm text-muted-foreground mt-1">
                  以下操作不可逆，请谨慎操作
                </p>
              </div>

              <div class="p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                <div class="flex items-center justify-between">
                  <div>
                    <h4 class="font-medium">
                      删除团队
                    </h4>
                    <p class="text-sm text-muted-foreground mt-1">
                      删除团队后，所有成员关系将被解除
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    @click="isDeleteTeamDialogOpen = true"
                  >
                    <Trash2 class="h-4 w-4 mr-2" />
                    删除团队
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </TabsContent>

        <!-- 成员管理 Tab -->
        <TabsContent value="members" class="flex-1 flex flex-col overflow-hidden px-6 py-4">
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
              v-if="isCurrentUserAdmin"
              size="sm"
              @click="isInviteDialogOpen = true"
            >
              <UserPlus class="h-4 w-4 mr-1" />
              邀请
            </Button>
          </div>

          <!-- 成员列表 -->
          <ScrollArea class="flex-1 -mx-6 px-6">
            <!-- 加载状态 -->
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

            <!-- 成员列表 -->
            <div v-else class="space-y-2">
              <TeamMemberItem
                v-for="member in filteredMembers"
                :key="member.id"
                :team-id="team?.id ?? ''"
                :member="member"
                :team-roles="teamRoles"
                :is-current-user-admin="isCurrentUserAdmin"
                @update-role="handleMemberRoleUpdated"
                @delete-member="handleDeleteMember"
              />

              <!-- 空状态 -->
              <div
                v-if="filteredMembers.length === 0 && !isLoadingMembers"
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
        </TabsContent>
      </Tabs>
    </SheetContent>
  </Sheet>

  <!-- 头像裁剪器 -->
  <Cropper
    v-model:open="cropperOpen"
    v-model:source-url="cropperSourceUrl"
    @confirm="handleAvatarCropped"
  />

  <!-- 邀请成员对话框 -->
  <InviteTeamMemberDialog
    v-if="team"
    v-model:open="isInviteDialogOpen"
    :team-id="team.id"
    :team-name="team.name"
    :existing-member-ids="existingMemberIds"
    @invited="handleMemberInvited"
  />

  <!-- 删除团队确认 -->
  <DeleteTeamDialog
    v-model:open="isDeleteTeamDialogOpen"
    :team="team"
    @deleted="handleTeamDeleted"
  />

  <!-- 删除成员确认 -->
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
</template>
