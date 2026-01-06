<script lang="ts" setup>
import { Loader2 } from 'lucide-vue-next'
import { ref, useTemplateRef } from 'vue'
import VuePictureCropper, { cropper } from 'vue-picture-cropper'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const props = withDefaults(defineProps<{
  /** 最大文件大小，单位为 MB */
  maxSize?: number
  /** 裁剪长宽比 */
  aspectRatio?: number
}>(), {
  maxSize: 10,
  aspectRatio: 1 / 1,
})

const emits = defineEmits<{
  (e: 'success', result: File): void
}>()

const fileInputRef = useTemplateRef('file-input')

const isOpen = ref(false)
const sourceUrl = ref('')
const isUploading = ref(false)

function triggerSelect() {
  fileInputRef.value?.click()
}

function onFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file)
    return

  if (!file.type.startsWith('image/')) {
    toast.error('请选择图片文件')
    return
  }

  const limit = props.maxSize
  if (file.size / 1024 / 1024 > limit) {
    toast.error(`图片大小不能超过 ${limit}MB`)
    return
  }

  const reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onload = (e) => {
    sourceUrl.value = e.target?.result as string
    isOpen.value = true
    input.value = ''
  }
}

async function handleConfirm() {
  if (!cropper)
    return

  try {
    isUploading.value = true

    const file = await cropper.getFile({
      fileName: 'cropped_result.png',
      fileType: 'image/png',
    })

    if (!file)
      throw new Error('裁剪失败')

    emits('success', file)
    isOpen.value = false
  }
  catch (error) {
    console.error('裁剪失败', error)
    toast.error('裁剪失败，请重试')
  }
  finally {
    isUploading.value = false
  }
}
</script>

<template>
  <input
    ref="file-input"
    type="file"
    accept="image/png, image/jpeg, image/webp, image/avif"
    class="hidden"
    @change="onFileSelect"
  >

  <div @click="triggerSelect">
    <slot />
  </div>

  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-125">
      <DialogHeader>
        <DialogTitle>编辑头像</DialogTitle>
        <DialogDescription>
          拖动或缩放图片调整位置
        </DialogDescription>
      </DialogHeader>

      <div class="flex items-center justify-center p-4 bg-muted/30 rounded-lg">
        <VuePictureCropper
          v-if="isOpen && sourceUrl"
          :img="sourceUrl"
          :box-style="{
            width: '100%',
            height: '350px',
            backgroundColor: 'transparent',
            margin: '0 auto',
          }"
          :options="{
            aspectRatio: props.aspectRatio ?? 1,
            viewMode: 1,
            dragMode: 'move',
            background: false,
            movable: true,
            zoomable: true,
          }"
        />
      </div>

      <DialogFooter>
        <DialogClose as-child>
          <Button variant="outline" :disabled="isUploading">
            取消
          </Button>
        </DialogClose>
        <Button :disabled="isUploading" @click="handleConfirm">
          <Loader2 v-if="isUploading" class="mr-2 h-4 w-4 animate-spin" />
          {{ isUploading ? '上传中...' : '确认并应用' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
