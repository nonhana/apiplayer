<script lang="ts" setup>
import type { TeamItem } from '@/types/team'
import { AlertTriangle, Loader2 } from 'lucide-vue-next'
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
import { Input } from '@/components/ui/input'
import { useTeamStore } from '@/stores/useTeamStore'

const props = defineProps<{
  team: TeamItem | null
}>()

const emits = defineEmits<{
  (e: 'deleted', teamId: string): void
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const teamStore = useTeamStore()

const confirmText = ref('')
const isDeleting = ref(false)

const requiredConfirmText = computed(() => props.team?.name ?? '')

const canDelete = computed(() =>
  confirmText.value === requiredConfirmText.value && !isDeleting.value,
)

const hasProjects = computed(() => (props.team?.projectCount ?? 0) > 0)

async function handleDelete() {
  if (!props.team || !canDelete.value)
    return

  isDeleting.value = true
  try {
    await teamApi.deleteTeam(props.team.id)

    // 从 store 中移除团队
    teamStore.removeTeam(props.team.id)

    toast.success('团队已删除', {
      description: `团队 "${props.team.name}" 已成功删除`,
    })

    emits('deleted', props.team.id)
    isOpen.value = false
  }
  catch (error) {
    console.error('删除团队失败', error)
    toast.error('删除团队失败，请重试')
  }
  finally {
    isDeleting.value = false
  }
}

watch(isOpen, (newV) => {
  if (!newV) {
    confirmText.value = ''
  }
})
</script>

<template>
  <AlertDialog v-model:open="isOpen">
    <AlertDialogContent class="max-w-md">
      <AlertDialogHeader>
        <AlertDialogTitle class="flex items-center gap-2 text-destructive">
          <AlertTriangle class="h-5 w-5" />
          删除团队
        </AlertDialogTitle>
        <AlertDialogDescription class="space-y-3">
          <p>
            您确定要删除团队 <span class="font-semibold text-foreground">{{ team?.name }}</span> 吗？
          </p>

          <div
            v-if="hasProjects"
            class="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm"
          >
            <p class="font-medium text-destructive">
              ⚠️ 此团队包含 {{ team?.projectCount }} 个项目
            </p>
            <p class="mt-1 text-muted-foreground">
              请先删除或转移所有项目后再删除团队
            </p>
          </div>

          <div v-else class="space-y-2">
            <p class="text-sm text-muted-foreground">
              此操作不可撤销。团队的所有成员关系将被解除。
            </p>
            <p class="text-sm">
              请输入 <span class="font-mono font-semibold text-foreground">{{ team?.name }}</span> 来确认删除：
            </p>
            <Input
              v-model="confirmText"
              :placeholder="team?.name"
              :disabled="isDeleting"
              class="mt-2"
            />
          </div>
        </AlertDialogDescription>
      </AlertDialogHeader>

      <AlertDialogFooter>
        <AlertDialogCancel :disabled="isDeleting">
          取消
        </AlertDialogCancel>
        <AlertDialogAction
          :disabled="hasProjects || !canDelete"
          class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          @click.prevent="handleDelete"
        >
          <Loader2 v-if="isDeleting" class="h-4 w-4 mr-2 animate-spin" />
          确认删除
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
