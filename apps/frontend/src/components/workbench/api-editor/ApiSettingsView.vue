<script lang="ts" setup>
import type { ApiDetail } from '@/types/api'
import { AlertTriangle, Trash2 } from 'lucide-vue-next'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { methodBadgeColors } from '@/constants/api'
import { cn } from '@/lib/utils'
import { useTabStore } from '@/stores/useTabStore'
import DeleteApiDialog from '../dialogs/DeleteApiDialog.vue'

const props = defineProps<{
  api: ApiDetail
}>()

const router = useRouter()
const tabStore = useTabStore()

const isDeleteDialogOpen = ref(false)

function handleDeleteSuccess() {
  tabStore.removeTab(props.api.id)
  router.push({ name: 'WorkbenchHome' })
}
</script>

<template>
  <ScrollArea class="h-full">
    <div class="max-w-2xl mx-auto p-6 space-y-6">
      <Card class="border-destructive/50">
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-destructive">
            <AlertTriangle class="h-5 w-5" />
            危险操作
          </CardTitle>
          <CardDescription>
            以下操作不可逆，请谨慎执行
          </CardDescription>
        </CardHeader>

        <CardContent class="space-y-4">
          <Separator />

          <div class="flex items-start justify-between gap-4">
            <div class="space-y-1">
              <h4 class="text-sm font-medium">
                删除此接口
              </h4>
              <p class="text-sm text-muted-foreground">
                删除后，该接口的所有数据（包括版本历史）将被永久移除，无法恢复。
              </p>
              <div class="flex items-center gap-2 mt-2 p-2 rounded-md bg-muted/50">
                <Badge
                  variant="outline"
                  :class="cn('shrink-0 font-bold text-xs', methodBadgeColors[api.method])"
                >
                  {{ api.method }}
                </Badge>
                <span class="font-mono text-xs truncate">
                  {{ api.path }}
                </span>
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              class="shrink-0"
              @click="isDeleteDialogOpen = true"
            >
              <Trash2 class="h-4 w-4 mr-2" />
              删除接口
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </ScrollArea>

  <DeleteApiDialog
    v-model:open="isDeleteDialogOpen"
    :api="api"
    @success="handleDeleteSuccess"
  />
</template>
