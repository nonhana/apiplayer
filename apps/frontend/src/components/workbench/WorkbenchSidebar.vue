<script lang="ts" setup>
import {
  ChevronRight,
  Globe,
  Home,
  Import,
  Settings,
} from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn, getAbbreviation } from '@/lib/utils'
import { useProjectStore } from '@/stores/useProjectStore'
import ImportOpenapiDialog from './dialogs/import/ImportOpenapiDialog.vue'
import ProjectSettingsSheet from './ProjectSettingsSheet.vue'

const router = useRouter()

const projectStore = useProjectStore()
const { projectDetail, environments, curEnvId, curEnv } = storeToRefs(projectStore)
const { setCurEnvId } = projectStore

const isSettingsSheetOpen = ref(false)
const isEnvPopoverOpen = ref(false)
const isImportDialogOpen = ref(false)

function goBack() {
  router.push({ name: 'Dashboard' })
}

function selectEnv(envId: string) {
  setCurEnvId(envId)
  isEnvPopoverOpen.value = false
}

function getEnvColor(envName: string): string {
  const name = envName.toLowerCase()
  if (name.includes('prod') || name.includes('生产'))
    return 'bg-red-500'
  if (name.includes('test') || name.includes('测试'))
    return 'bg-yellow-500'
  if (name.includes('dev') || name.includes('开发'))
    return 'bg-green-500'
  return 'bg-blue-500'
}
</script>

<template>
  <aside class="w-12 shrink-0 border-r border-border bg-sidebar flex flex-col items-center py-3">
    <TooltipProvider :delay-duration="100">
      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8 text-muted-foreground hover:text-foreground"
            @click="goBack"
          >
            <Home class="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" :side-offset="8">
          <p>返回工作台</p>
        </TooltipContent>
      </Tooltip>

      <Separator class="w-6 my-3" />

      <Tooltip v-if="projectDetail">
        <TooltipTrigger as-child>
          <button class="group relative" @click="isSettingsSheetOpen = true">
            <Avatar class="h-8 w-8 rounded-lg border-2 border-transparent group-hover:border-primary/50 transition-colors">
              <AvatarImage v-if="projectDetail.icon" :src="projectDetail.icon" />
              <AvatarFallback class="text-xs rounded-lg bg-primary/10 text-primary font-semibold">
                {{ getAbbreviation(projectDetail.name, 'P') }}
              </AvatarFallback>
            </Avatar>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" :side-offset="8" class="max-w-52">
          <p class="font-medium">
            {{ projectDetail.name }}
          </p>
          <p class="text-xs text-muted-foreground mt-1.5">
            点击进入项目设置
          </p>
        </TooltipContent>
      </Tooltip>
      <Skeleton v-else class="h-8 w-8 rounded-lg mb-1" />

      <Separator class="w-6 my-3" />

      <Popover v-model:open="isEnvPopoverOpen">
        <PopoverTrigger as-child>
          <span>
            <Tooltip :disabled="isEnvPopoverOpen">
              <TooltipTrigger as-child>
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8 relative text-muted-foreground hover:text-foreground"
                  :disabled="environments.length === 0"
                >
                  <Globe class="h-4 w-4" />
                  <span
                    v-if="curEnv"
                    :class="cn(
                      'absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-sidebar',
                      getEnvColor(curEnv.name),
                    )"
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" :side-offset="8">
                <p>{{ curEnv?.name || '选择环境' }}</p>
              </TooltipContent>
            </Tooltip>
          </span>
        </PopoverTrigger>

        <PopoverContent side="right" align="start" :side-offset="8" class="w-52 p-1.5">
          <div class="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            切换环境
          </div>
          <div class="space-y-0.5">
            <button
              v-for="env in environments"
              :key="env.id"
              class="w-full flex items-center gap-2.5 px-2 py-2 text-sm rounded-md hover:bg-accent transition-colors"
              :class="{ 'bg-accent': curEnvId === env.id }"
              @click="selectEnv(env.id)"
            >
              <span
                :class="cn(
                  'h-2 w-2 rounded-full shrink-0',
                  getEnvColor(env.name),
                )"
              />
              <span class="truncate flex-1 text-left">{{ env.name }}</span>
              <ChevronRight
                v-if="curEnvId === env.id"
                class="h-3.5 w-3.5 text-primary shrink-0"
              />
            </button>
          </div>
          <div v-if="environments.length === 0" class="px-2 py-6 text-center text-xs text-muted-foreground">
            暂无可用环境
          </div>
        </PopoverContent>
      </Popover>

      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8 mt-1 text-muted-foreground hover:text-foreground"
            @click="isImportDialogOpen = true"
          >
            <Import class="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          导入 OpenAPI
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8 mt-1 text-muted-foreground hover:text-foreground"
            :disabled="!projectDetail"
            @click="isSettingsSheetOpen = true"
          >
            <Settings class="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" :side-offset="8">
          <p>项目设置</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>

    <ProjectSettingsSheet
      v-if="projectDetail"
      v-model:open="isSettingsSheetOpen"
      :project="projectDetail"
    />

    <ImportOpenapiDialog
      v-model:open="isImportDialogOpen"
    />
  </aside>
</template>
