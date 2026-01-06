<script lang="ts" setup>
import type { ProjectDetail } from '@/types/project'
import {
  Globe,
  Settings,
  Users,
} from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { ROLE_NAME } from '@/constants/roles'
import { getAbbreviation } from '@/lib/utils'
import ProjectBasicInfoTab from './ProjectBasicInfoTab.vue'
import ProjectEnvTab from './ProjectEnvTab.vue'
import ProjectMemberTab from './ProjectMemberTab.vue'

const props = defineProps<{
  project: ProjectDetail
}>()

const isOpen = defineModel<boolean>('open', { required: true })

/** 当前用户是否为管理员（project:admin） */
const isAdmin = computed(() => {
  const roleName = props.project.currentUserRole?.name
  return roleName === ROLE_NAME.PROJECT_ADMIN
})

/** 当前用户是否可以编辑（project:admin 或 project:editor） */
const canEdit = computed(() => {
  const roleName = props.project.currentUserRole?.name
  return roleName === ROLE_NAME.PROJECT_ADMIN || roleName === ROLE_NAME.PROJECT_EDITOR
})

// Tab 状态
const activeTab = ref('info')

watch(isOpen, (open) => {
  if (open) {
    activeTab.value = 'info'
  }
}, { immediate: true })
</script>

<template>
  <Sheet v-model:open="isOpen">
    <SheetContent class="sm:max-w-135 flex flex-col p-0">
      <SheetHeader class="px-6 pt-6 pb-4">
        <div class="flex items-center gap-3">
          <Avatar class="h-12 w-12 border-2 rounded-lg">
            <AvatarImage v-if="project.icon" :src="project.icon" />
            <AvatarFallback class="text-lg font-semibold bg-primary/10 text-primary rounded-lg">
              {{ getAbbreviation(project.name, 'P') }}
            </AvatarFallback>
          </Avatar>
          <div>
            <SheetTitle class="text-lg">
              {{ project.name }}
            </SheetTitle>
            <SheetDescription>
              管理项目信息、成员和环境
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <Tabs v-model="activeTab" class="flex-1 flex flex-col overflow-hidden">
        <TabsList class="mx-6 grid w-auto grid-cols-3">
          <TabsTrigger value="info" class="gap-2">
            <Settings class="h-4 w-4" />
            基本信息
          </TabsTrigger>
          <TabsTrigger value="members" class="gap-2">
            <Users class="h-4 w-4" />
            成员
            <span class="text-xs text-muted-foreground">
              ({{ project.memberCount }})
            </span>
          </TabsTrigger>
          <TabsTrigger value="environments" class="gap-2">
            <Globe class="h-4 w-4" />
            环境
            <span class="text-xs text-muted-foreground">
              ({{ project.environmentCount }})
            </span>
          </TabsTrigger>
        </TabsList>

        <!-- 基本信息 Tab -->
        <ProjectBasicInfoTab
          :project="project"
          :is-admin="isAdmin"
          :can-edit="canEdit"
          @deleted="isOpen = false"
        />

        <!-- 成员管理 Tab -->
        <ProjectMemberTab
          :project="project"
          :is-admin="isAdmin"
        />

        <!-- 环境管理 Tab -->
        <ProjectEnvTab
          :project="project"
          :can-edit="canEdit"
        />
      </Tabs>
    </SheetContent>
  </Sheet>
</template>
