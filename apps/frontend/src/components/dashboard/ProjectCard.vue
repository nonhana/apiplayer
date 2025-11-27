<script lang="ts" setup>
import type { ProjectItem } from '@/types/project'
import { Code2, Globe, Lock, MoreHorizontal, Pencil, Settings, Trash2, Users } from 'lucide-vue-next'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import dayjs from '@/lib/dayjs'

const props = defineProps<{
  project: ProjectItem
}>()
const emits = defineEmits<{
  (e: 'edit', project: ProjectItem): void
  (e: 'delete', project: ProjectItem): void
  (e: 'manageMembers', project: ProjectItem): void
}>()

const router = useRouter()

/** 项目图标 Fallback */
const projectInitials = computed(() => {
  const name = props.project.name.trim()
  const parts = name.split(/\s+/)
  if (parts.length === 1) {
    return (name.charAt(0) ?? 'P').toUpperCase()
  }
  return ((parts[0]?.charAt(0) ?? '') + (parts[1]?.charAt(0) ?? '')).toUpperCase() || 'P'
})

/** 相对时间 */
const relativeUpdatedAt = computed(() => dayjs(props.project.updatedAt).fromNow())

/** 是否有管理权限 */
const canManage = computed(() => {
  const roleName = props.project.currentUserRole?.name
  return roleName === 'project:admin' || roleName === 'project:editor'
})

/** 进入项目工作台 */
function handleEnterProject() {
  router.push({ name: 'Workbench', params: { projectId: props.project.id } })
}

function handleEdit() {
  emits('edit', props.project)
}

function handleDelete() {
  emits('delete', props.project)
}

function handleManageMembers() {
  emits('manageMembers', props.project)
}
</script>

<template>
  <Card
    class="group relative cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5"
    @click="handleEnterProject"
  >
    <!-- 操作菜单 -->
    <div
      v-if="canManage"
      class="absolute right-3 top-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
      @click.stop
    >
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8 bg-background/80 backdrop-blur-sm"
          >
            <MoreHorizontal class="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem @click="handleEdit">
            <Pencil class="mr-2 h-4 w-4" />
            编辑项目
          </DropdownMenuItem>
          <DropdownMenuItem @click="handleManageMembers">
            <Settings class="mr-2 h-4 w-4" />
            成员管理
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            class="text-destructive focus:text-destructive"
            @click="handleDelete"
          >
            <Trash2 class="mr-2 h-4 w-4" />
            删除项目
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <CardHeader class="pb-3">
      <div class="flex items-start gap-3">
        <Avatar class="h-12 w-12 rounded-lg border shadow-sm">
          <AvatarImage v-if="project.icon" :src="project.icon" />
          <AvatarFallback class="rounded-lg text-base font-bold bg-linear-to-br from-primary/20 to-primary/5 text-primary">
            {{ projectInitials }}
          </AvatarFallback>
        </Avatar>
        <div class="flex-1 min-w-0 space-y-1">
          <div class="flex items-center gap-2">
            <CardTitle class="text-base font-semibold truncate">
              {{ project.name }}
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Badge
                    :variant="project.isPublic ? 'secondary' : 'outline'"
                    class="shrink-0 h-5 px-1.5 gap-0.5"
                  >
                    <Globe v-if="project.isPublic" class="h-3 w-3" />
                    <Lock v-else class="h-3 w-3" />
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  {{ project.isPublic ? '公开项目' : '私有项目' }}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardDescription class="text-xs text-muted-foreground">
            更新于 {{ relativeUpdatedAt }}
          </CardDescription>
        </div>
      </div>
    </CardHeader>

    <CardContent class="pt-0">
      <p
        v-if="project.description"
        class="text-sm text-muted-foreground line-clamp-2 mb-4"
      >
        {{ project.description }}
      </p>
      <p
        v-else
        class="text-sm text-muted-foreground/60 italic mb-4"
      >
        暂无描述
      </p>

      <!-- 底部统计信息 -->
      <div class="flex items-center gap-4 text-xs text-muted-foreground">
        <div class="flex items-center gap-1">
          <Code2 class="h-3.5 w-3.5" />
          <span>{{ project.apiCount }} 个接口</span>
        </div>
        <div class="flex items-center gap-1">
          <Users class="h-3.5 w-3.5" />
          <span>{{ project.memberCount }} 名成员</span>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
