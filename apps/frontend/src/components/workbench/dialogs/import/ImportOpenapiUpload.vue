<script lang="ts" setup>
import type { UploadMethod } from '@/types/import'
import { FileUp, Globe, Keyboard } from 'lucide-vue-next'
import { ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

const emits = defineEmits<{
  (e: 'submit', data: { method: UploadMethod, file?: File, content?: string, url?: string }): void
}>()

const activeTab = ref<UploadMethod>('file')

// 文件上传
const selectedFile = ref<File | null>(null)
const isDragging = ref(false)

// URL 导入
const urlInput = ref('')

// 粘贴内容
const pasteContent = ref('')

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    validateAndSetFile(file)
  }
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) {
    validateAndSetFile(file)
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  isDragging.value = true
}

function handleDragLeave() {
  isDragging.value = false
}

function validateAndSetFile(file: File) {
  const validExtensions = ['.json', '.yaml', '.yml']
  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
  if (validExtensions.includes(extension)) {
    selectedFile.value = file
  }
  else {
    selectedFile.value = null
    toast.error('请上传 JSON 或 YAML 格式的 OpenAPI 文档')
  }
}

function clearFile() {
  selectedFile.value = null
}

function handleSubmit() {
  switch (activeTab.value) {
    case 'file':
      if (selectedFile.value) {
        emits('submit', { method: 'file', file: selectedFile.value })
      }
      break
    case 'url':
      if (urlInput.value.trim()) {
        emits('submit', { method: 'url', url: urlInput.value.trim() })
      }
      break
    case 'paste':
      if (pasteContent.value.trim()) {
        emits('submit', { method: 'paste', content: pasteContent.value.trim() })
      }
      break
  }
}

const isSubmitDisabled = ref(true)

watch([activeTab, selectedFile, urlInput, pasteContent], () => {
  switch (activeTab.value) {
    case 'file':
      isSubmitDisabled.value = !selectedFile.value
      break
    case 'url':
      isSubmitDisabled.value = !urlInput.value.trim()
      break
    case 'paste':
      isSubmitDisabled.value = !pasteContent.value.trim()
      break
  }
})
</script>

<template>
  <div class="space-y-4">
    <Tabs v-model="activeTab" class="w-full">
      <TabsList class="grid w-full grid-cols-3">
        <TabsTrigger value="file" class="flex items-center gap-2">
          <FileUp class="h-4 w-4" />
          上传文件
        </TabsTrigger>
        <TabsTrigger value="url" class="flex items-center gap-2">
          <Globe class="h-4 w-4" />
          URL 导入
        </TabsTrigger>
        <TabsTrigger value="paste" class="flex items-center gap-2">
          <Keyboard class="h-4 w-4" />
          粘贴内容
        </TabsTrigger>
      </TabsList>

      <TabsContent value="file" class="space-y-4 mt-4">
        <div
          class="border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer"
          :class="[
            isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50',
          ]"
          @drop="handleDrop"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
          @click="($refs.fileInput as HTMLInputElement)?.click()"
        >
          <input
            ref="fileInput"
            type="file"
            class="hidden"
            accept=".json,.yaml,.yml"
            @change="handleFileSelect"
          >
          <FileUp class="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          <p class="text-sm text-muted-foreground mb-2">
            拖拽文件到此处，或点击选择文件
          </p>
          <p class="text-xs text-muted-foreground">
            支持 JSON、YAML 格式的 OpenAPI 3.0/3.1 文档
          </p>
        </div>

        <div v-if="selectedFile" class="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div class="flex items-center gap-2">
            <FileUp class="h-4 w-4 text-primary" />
            <span class="text-sm">{{ selectedFile.name }}</span>
            <span class="text-xs text-muted-foreground">
              ({{ (selectedFile.size / 1024).toFixed(1) }} KB)
            </span>
          </div>
          <Button variant="ghost" size="sm" @click="clearFile">
            移除
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="url" class="space-y-4 mt-4">
        <div class="space-y-2">
          <Label for="openapi-url">OpenAPI 文档 URL</Label>
          <Input
            id="openapi-url"
            v-model="urlInput"
            placeholder="https://example.com/openapi.json"
            type="url"
          />
          <p class="text-xs text-muted-foreground">
            输入 OpenAPI 文档的完整 URL 地址，支持 JSON 或 YAML 格式
          </p>
        </div>
      </TabsContent>

      <TabsContent value="paste" class="space-y-4 mt-4">
        <div class="space-y-2">
          <Label for="openapi-content">OpenAPI 文档内容</Label>
          <Textarea
            id="openapi-content"
            v-model="pasteContent"
            placeholder="粘贴 OpenAPI 文档内容（JSON 或 YAML 格式）..."
            class="font-mono text-sm min-h-[200px] resize-y"
          />
          <p class="text-xs text-muted-foreground">
            直接粘贴 OpenAPI 3.0/3.1 文档内容
          </p>
        </div>
      </TabsContent>
    </Tabs>

    <div class="flex justify-end">
      <Button :disabled="isSubmitDisabled" @click="handleSubmit">
        下一步
      </Button>
    </div>
  </div>
</template>
