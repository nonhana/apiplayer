<script lang="ts" setup>
import type { TeamItem } from '@/types/team'
import { Loader2 } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { teamApi } from '@/api/team'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { slugify } from '@/lib/slug'
import { useTeamStore } from '@/stores/useTeamStore'
import { createTeamFormSchema } from '@/validators/team'

const isOpen = defineModel<boolean>('open', { required: true })

const teamStore = useTeamStore()

const isSubmitting = ref(false)

const { handleSubmit, resetForm, setFieldValue, values } = useForm({
  validationSchema: createTeamFormSchema,
  initialValues: {
    name: '',
    slug: '',
    description: '',
    avatar: '',
  },
})

watch(
  () => values.name,
  (newV) => {
    setFieldValue('slug', newV ? slugify(newV) : '')
  },
)

const onSubmit = handleSubmit(async (formValues) => {
  isSubmitting.value = true
  try {
    const newTeam = await teamApi.createTeam({
      name: formValues.name,
      slug: formValues.slug,
      description: formValues.description || undefined,
      avatar: formValues.avatar || undefined,
    })

    // store 自动切换到新创建的团队
    const teamItem: TeamItem = {
      ...newTeam,
      isActive: true,
      updatedAt: newTeam.createdAt,
      memberCount: 1,
      projectCount: 0,
      currentUserRole: {
        id: 'team:owner',
        name: 'team:owner',
        description: '团队所有者',
      },
    }
    teamStore.addTeam(teamItem)
    await teamStore.switchTeam(newTeam.id)

    toast.success('团队创建成功', {
      description: `团队 "${newTeam.name}" 已创建`,
    })

    isOpen.value = false
  }
  catch (error) {
    console.error('创建团队失败', error)
  }
  finally {
    isSubmitting.value = false
  }
})

watch(isOpen, (open) => {
  if (!open) {
    resetForm()
  }
})
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-120">
      <DialogHeader>
        <DialogTitle>创建团队</DialogTitle>
        <DialogDescription>
          创建一个新团队来组织您的项目和成员
        </DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit="onSubmit">
        <FormField v-slot="{ componentField }" name="name">
          <FormItem>
            <FormLabel>团队名称 <span class="text-destructive">*</span></FormLabel>
            <FormControl>
              <Input placeholder="如：我的团队" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="slug">
          <FormItem>
            <FormLabel>团队标识符 <span class="text-destructive">*</span></FormLabel>
            <FormControl>
              <Input placeholder="如：my-team" v-bind="componentField" />
            </FormControl>
            <FormDescription>
              URL 友好的唯一标识符，只能包含小写字母、数字和连字符
            </FormDescription>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="description">
          <FormItem>
            <FormLabel>团队描述</FormLabel>
            <FormControl>
              <Textarea
                placeholder="简要描述您的团队..."
                rows="3"
                v-bind="componentField"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            :disabled="isSubmitting"
            @click="isOpen = false"
          >
            取消
          </Button>
          <Button type="submit" :disabled="isSubmitting">
            <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
            创建团队
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
