<script lang="ts" setup>
import { Loader2 } from 'lucide-vue-next'
import { ref } from 'vue'
import VuePictureCropper, { cropper } from 'vue-picture-cropper'
import { toast } from 'vue-sonner'
import { utilApi } from '@/api/util'
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

const emits = defineEmits<{
  (e: 'confirm', url: string): void
}>()

const isOpen = defineModel<boolean>('open', { required: true })
const sourceUrl = defineModel<string | null>('sourceUrl', { required: true })

const isUploading = ref(false)

async function handleConfirm() {
  if (!sourceUrl.value || !cropper) {
    toast.error('无法裁剪头像，请重新选择图片')
    return
  }

  try {
    isUploading.value = true
    const file = await cropper.getFile({
      fileName: 'avatar.png',
      fileType: 'image/png,image/jpeg,image/webp,image/avif',
    })
    if (!file) {
      toast.error('裁剪头像失败，请重试')
      return
    }
    const { url } = await utilApi.uploadFile(file)
    emits('confirm', url)
    sourceUrl.value = null
    isOpen.value = false
  }
  catch (error) {
    console.error('Upload avatar failed', error)
    toast.error('裁剪头像失败，请重试')
  }
  finally {
    isUploading.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>裁剪头像</DialogTitle>
        <DialogDescription>
          拖动图片或缩放以调整头像显示区域，确认后会自动上传并更新下方预览。
        </DialogDescription>
      </DialogHeader>

      <div class="p-4 flex-1 min-h-[260px]">
        <VuePictureCropper
          v-if="sourceUrl"
          :img="sourceUrl"
          :box-style="{
            width: '100%',
            height: '320px',
            backgroundColor: 'hsl(var(--muted))',
            margin: '0 auto',
          }"
          :options="{
            aspectRatio: 1,
            viewMode: 1,
            dragMode: 'move',
            background: false,
            movable: true,
            zoomable: true,
            responsive: true,
          }"
        />
      </div>

      <DialogFooter class="flex items-center justify-end gap-2 px-4 py-3 border-t">
        <DialogClose>
          <Button
            type="button"
            variant="outline"
            size="sm"
            :disabled="isUploading"
            @click="sourceUrl = null"
          >
            取消
          </Button>
        </DialogClose>
        <Button
          type="button"
          size="sm"
          :disabled="isUploading"
          @click="handleConfirm"
        >
          <Loader2 v-if="isUploading" class="mr-2 h-4 w-4 animate-spin" />
          确认并上传
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
