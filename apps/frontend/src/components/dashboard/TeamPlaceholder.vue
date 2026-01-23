<script lang="ts" setup>
import { Building2, Plus, Users } from 'lucide-vue-next'
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useTeamStore } from '@/stores/useTeamStore'

const emits = defineEmits<{
  (e: 'createTeam'): void
}>()

const teamStore = useTeamStore()

const isLoading = computed(() => teamStore.isLoading)
const hasNoTeams = computed(() => !teamStore.isLoading && teamStore.teams.length === 0)
const hasTeamsButNotSelected = computed(
  () => !teamStore.isLoading && teamStore.teams.length > 0 && !teamStore.curTeamId,
)
</script>

<template>
  <div
    v-if="isLoading"
    class="flex flex-col items-center justify-center py-20 px-4"
  >
    <Skeleton class="h-20 w-20 rounded-full mb-6" />
    <Skeleton class="h-6 w-48 mb-3" />
    <Skeleton class="h-4 w-64 mb-6" />
    <Skeleton class="h-10 w-32" />
  </div>

  <div
    v-else-if="hasNoTeams"
    class="flex flex-col items-center justify-center py-20 px-4"
  >
    <div class="relative mb-6">
      <div class="w-20 h-20 rounded-full bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center">
        <Building2 class="h-10 w-10 text-primary" />
      </div>
      <div class="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center">
        <Plus class="h-4 w-4 text-muted-foreground" />
      </div>
    </div>

    <h2 class="text-xl font-semibold mb-2">
      还没有团队
    </h2>
    <p class="text-sm text-muted-foreground text-center max-w-md mb-6">
      团队是您组织项目和协作的基础。创建一个团队，开始管理您的 API 项目吧！
    </p>

    <Button size="lg" @click="emits('createTeam')">
      <Plus class="h-4 w-4 mr-2" />
      创建第一个团队
    </Button>
  </div>

  <div
    v-else-if="hasTeamsButNotSelected"
    class="flex flex-col items-center justify-center py-20 px-4"
  >
    <div class="w-20 h-20 rounded-full bg-linear-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center mb-6">
      <Users class="h-10 w-10 text-amber-500" />
    </div>

    <h2 class="text-xl font-semibold mb-2">
      请选择一个团队
    </h2>
    <p class="text-sm text-muted-foreground text-center max-w-md mb-6">
      您有 {{ teamStore.teams.length }} 个团队，请在顶部的团队选择器中选择一个团队来查看项目。
    </p>
  </div>
</template>
