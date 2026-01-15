import type { UpdateUserProfileReq, UserFullInfo } from '@/types/user'
import { useForm } from 'vee-validate'
import { computed, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { userApi } from '@/api/user'
import { utilApi } from '@/api/util'
import { useUserStore } from '@/stores/useUserStore'
import { userProfileFormSchema } from '@/validators/user-profile'

/**
 * 用户资料管理 composable
 * 封装用户资料的加载、编辑、保存等逻辑
 */
export function useUserProfile() {
  const userStore = useUserStore()

  // 用户完整资料
  const profile = ref<UserFullInfo | null>(null)

  // 加载状态
  const isLoadingProfile = ref(false)
  const isSavingProfile = ref(false)
  const isSendingCode = ref(false)
  const isUploadingAvatar = ref(false)

  // 表单实例
  const form = useForm({
    validationSchema: userProfileFormSchema,
  })

  // 计算属性：展示用的信息
  const displayEmail = computed(() => profile.value?.email ?? '')
  const displayCreatedAt = computed(() =>
    profile.value?.createdAt
      ? new Date(profile.value.createdAt).toLocaleString()
      : '',
  )
  const displayLastLoginAt = computed(() =>
    profile.value?.lastLoginAt
      ? new Date(profile.value.lastLoginAt).toLocaleString()
      : '首次登录',
  )

  // 头像预览 URL，优先从表单中取
  const avatarPreviewUrl = computed(() => {
    const formAvatar = form.values.avatar
    if (formAvatar && formAvatar !== '')
      return formAvatar
    return profile.value?.avatar ?? ''
  })

  /** 加载用户资料 */
  async function loadProfile() {
    try {
      isLoadingProfile.value = true
      const res = await userApi.getProfile()
      profile.value = res
      userStore.setUser(res)

      // 初始化表单值
      form.setValues({
        name: res.name,
        username: res.username,
        avatar: res.avatar ?? '',
        bio: res.bio ?? '',
        newEmail: '',
        newPassword: '',
        confirmNewPassword: '',
        verificationCode: '',
      })
    }
    catch (error) {
      console.error('加载用户信息失败', error)
    }
    finally {
      isLoadingProfile.value = false
    }
  }

  /** 发送安全验证码 */
  async function sendVerificationCode() {
    try {
      isSendingCode.value = true
      await userApi.sendProfileVerificationCode()
      toast.success('验证码已发送', {
        description: '请在 5 分钟内前往邮箱查收验证码。',
      })
    }
    catch (error) {
      console.error('发送验证码失败', error)
    }
    finally {
      isSendingCode.value = false
    }
  }

  /** 保存用户资料 */
  async function saveProfile(values: Record<string, unknown>) {
    const payload: UpdateUserProfileReq = {
      name: values.name as string,
      username: values.username as string,
      avatar: (values.avatar as string) || undefined,
      bio: (values.bio as string) || undefined,
      newEmail: (values.newEmail as string) || undefined,
      newPassword: (values.newPassword as string) || undefined,
      confirmNewPassword: (values.confirmNewPassword as string) || undefined,
      verificationCode: (values.verificationCode as string) || undefined,
    }

    isSavingProfile.value = true
    try {
      const updated = await userApi.updateProfile(payload)
      profile.value = updated
      userStore.setUser(updated)

      toast.success('个人资料已更新')

      // 清空敏感字段
      form.setFieldValue('newEmail', '')
      form.setFieldValue('newPassword', '')
      form.setFieldValue('confirmNewPassword', '')
      form.setFieldValue('verificationCode', '')

      return true
    }
    catch (error) {
      console.error('更新个人信息失败', error)
      return false
    }
    finally {
      isSavingProfile.value = false
    }
  }

  /** 处理头像裁剪上传 */
  async function uploadAvatar(file: File) {
    isUploadingAvatar.value = true
    try {
      const { url } = await utilApi.uploadFile(file)
      form.setFieldValue('avatar', url)
      toast.success('头像已更新')
      return url
    }
    catch (error) {
      console.error('头像更新失败', error)
      return null
    }
    finally {
      isUploadingAvatar.value = false
    }
  }

  // 组件挂载时自动加载
  onMounted(() => {
    loadProfile()
  })

  return {
    // 状态
    profile,
    isLoadingProfile,
    isSavingProfile,
    isSendingCode,
    isUploadingAvatar,

    // 表单
    form,

    // 计算属性
    displayEmail,
    displayCreatedAt,
    displayLastLoginAt,
    avatarPreviewUrl,

    // 方法
    loadProfile,
    sendVerificationCode,
    saveProfile,
    uploadAvatar,
  }
}
