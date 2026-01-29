<script lang="ts" setup>
import type { ConflictStrategy, ImportPreview, ImportResult, ImportStep, UploadMethod } from '@/types/import'
import { Loader2 } from 'lucide-vue-next'
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { importApi } from '@/api/import'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useApiTreeStore } from '@/stores/useApiTreeStore'
import ImportOpenapiPreview from './ImportOpenapiPreview.vue'
import ImportOpenapiResult from './ImportOpenapiResult.vue'
import ImportOpenapiUpload from './ImportOpenapiUpload.vue'

const isOpen = defineModel<boolean>('open', { required: true })

const route = useRoute()
const apiTreeStore = useApiTreeStore()

const currentStep = ref<ImportStep>('upload')
const isLoading = ref(false)

const preview = ref<ImportPreview | null>(null)
const result = ref<ImportResult | null>(null)

const stepTitles: Record<ImportStep, string> = {
  upload: '选择导入方式',
  preview: '预览与配置',
  result: '导入结果',
}

const stepDescriptions: Record<ImportStep, string> = {
  upload: '上传 OpenAPI 文档文件，或提供 URL / 粘贴内容',
  preview: '确认导入的接口列表和配置选项',
  result: '查看导入结果',
}

watch(isOpen, (open) => {
  if (!open) {
    // 重置状态
    currentStep.value = 'upload'
    preview.value = null
    result.value = null
    isLoading.value = false
  }
})

async function handleUpload(data: { method: UploadMethod, file?: File, content?: string, url?: string }) {
  const projectId = route.params.projectId as string

  isLoading.value = true
  try {
    let previewData: ImportPreview

    switch (data.method) {
      case 'file':
        if (data.file) {
          previewData = await importApi.parseOpenapiFile(projectId, data.file)
        }
        else {
          throw new Error('未选择文件')
        }
        break
      case 'url':
        previewData = await importApi.parseOpenapi(projectId, { url: data.url })
        break
      case 'paste':
        previewData = await importApi.parseOpenapi(projectId, { content: data.content })
        break
      default:
        throw new Error('未知的上传方式')
    }

    preview.value = previewData
    currentStep.value = 'preview'
    toast.success(`解析成功，共发现 ${previewData.stats.totalApis} 个接口`)
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : '解析失败'
    toast.error(message)
  }
  finally {
    isLoading.value = false
  }
}

async function handleExecuteImport(config: {
  conflictStrategy: ConflictStrategy
  targetGroupId?: string
  createMissingGroups: boolean
}) {
  if (!preview.value)
    return

  const projectId = route.params.projectId as string

  isLoading.value = true
  try {
    const importResult = await importApi.executeImport(projectId, {
      content: preview.value.content,
      conflictStrategy: config.conflictStrategy,
      targetGroupId: config.targetGroupId,
      createMissingGroups: config.createMissingGroups,
    })

    result.value = importResult
    currentStep.value = 'result'

    // 刷新 API 树
    await apiTreeStore.refreshTree()

    if (importResult.failedCount === 0) {
      toast.success(`导入成功，共创建 ${importResult.createdCount} 个接口`)
    }
    else {
      toast.warning(`导入完成，${importResult.failedCount} 个接口失败`)
    }
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : '导入失败'
    toast.error(message)
  }
  finally {
    isLoading.value = false
  }
}

function handleBack() {
  currentStep.value = 'upload'
}

function handleClose() {
  isOpen.value = false
}
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
      <DialogHeader>
        <DialogTitle>
          导入 OpenAPI 文档
          <span class="text-muted-foreground font-normal ml-2">
            - {{ stepTitles[currentStep] }}
          </span>
        </DialogTitle>
        <DialogDescription>
          {{ stepDescriptions[currentStep] }}
        </DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-auto py-4">
        <!-- Loading 状态 -->
        <div v-if="isLoading" class="flex flex-col items-center justify-center py-12">
          <Loader2 class="h-8 w-8 animate-spin text-primary mb-4" />
          <p class="text-sm text-muted-foreground">
            {{ currentStep === 'upload' ? '正在解析文档...' : '正在导入接口...' }}
          </p>
        </div>

        <!-- Step 1: 上传 -->
        <ImportOpenapiUpload
          v-else-if="currentStep === 'upload'"
          @submit="handleUpload"
        />

        <!-- Step 2: 预览 -->
        <ImportOpenapiPreview
          v-else-if="currentStep === 'preview' && preview"
          :preview="preview"
          :is-loading="isLoading"
          @submit="handleExecuteImport"
          @back="handleBack"
        />

        <!-- Step 3: 结果 -->
        <ImportOpenapiResult
          v-else-if="currentStep === 'result' && result"
          :result="result"
          @close="handleClose"
        />
      </div>
    </DialogContent>
  </Dialog>
</template>
