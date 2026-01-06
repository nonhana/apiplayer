<script lang="ts" setup>
import type { ProjectEnv, ProjectEnvType } from '@/types/project'
import { Check, MoreHorizontal, Pencil, Star, Trash2 } from 'lucide-vue-next'
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ENV_TYPE_LABEL_MAP } from '@/constants/project'
import { useProjectStore } from '@/stores/useProjectStore'

const props = defineProps<{
  env: ProjectEnv
  canEdit: boolean
}>()

const emits = defineEmits<{
  (e: 'edit', value: ProjectEnv): void
  (e: 'delete', value: ProjectEnv): void
}>()

const projectStore = useProjectStore()

const isSettingDefault = ref(false)

/** 获取环境类型的样式 */
function getEnvTypeBadgeVariant(type: ProjectEnvType): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (type) {
    case 'PROD':
      return 'destructive'
    case 'STAGING':
      return 'default'
    case 'TEST':
      return 'secondary'
    default:
      return 'outline'
  }
}

async function setAsDefault() {
  if (props.env.isDefault)
    return

  isSettingDefault.value = true
  try {
    await projectStore.setDefaultEnv(props.env.id)
    toast.success(`已将 "${props.env.name}" 设为默认环境`)
  }
  catch {
    toast.error('设置默认环境失败')
  }
  finally {
    isSettingDefault.value = false
  }
}
</script>

<template>
  <div class="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
    <div class="flex items-start justify-between gap-4">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <span class="font-medium truncate">{{ env.name }}</span>
          <Badge :variant="getEnvTypeBadgeVariant(env.type)" class="text-xs">
            {{ ENV_TYPE_LABEL_MAP[env.type] }}
          </Badge>
          <Badge v-if="env.isDefault" variant="outline" class="text-xs gap-1">
            <Star class="h-3 w-3 fill-current" />
            默认
          </Badge>
        </div>
        <p class="text-sm text-muted-foreground truncate">
          {{ env.baseUrl }}
        </p>
      </div>

      <DropdownMenu v-if="canEdit">
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="icon" class="h-8 w-8 shrink-0">
            <MoreHorizontal class="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            v-if="!env.isDefault"
            :disabled="isSettingDefault"
            @click="setAsDefault"
          >
            <Check class="h-4 w-4 mr-2" />
            设为默认
          </DropdownMenuItem>
          <DropdownMenuItem @click="emits('edit', env)">
            <Pencil class="h-4 w-4 mr-2" />
            编辑
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            class="text-destructive focus:text-destructive"
            @click="emits('delete', env)"
          >
            <Trash2 class="h-4 w-4 mr-2" />
            删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
</template>
