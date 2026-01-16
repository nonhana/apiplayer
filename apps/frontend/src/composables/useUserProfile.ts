import type { UpdateUserProfileReq, UserFullInfo } from '@/types/user'
import { useForm } from 'vee-validate'
import { computed, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { userApi } from '@/api/user'
import { utilApi } from '@/api/util'
import dayjs from '@/lib/dayjs'
import { useUserStore } from '@/stores/useUserStore'
import { userProfileFormSchema } from '@/validators/user-profile'

let cachedState: ReturnType<typeof createUserProfileState> | null = null

function createUserProfileState() {
  const userStore = useUserStore()

  const profile = ref<UserFullInfo | null>(null)

  const isLoadingProfile = ref(false) // 加载用户资料
  const isSavingProfile = ref(false) // 保存用户资料
  const isSendingCode = ref(false) // 发送验证码
  const isUploadingAvatar = ref(false) // 上传头像
  const hasLoadedProfile = ref(false)
  let loadPromise: Promise<void> | null = null

  const form = useForm({
    validationSchema: userProfileFormSchema,
  })

  const displayEmail = computed(() => profile.value?.email ?? '')
  const displayCreatedAt = computed(() =>
    profile.value?.createdAt
      ? dayjs(profile.value.createdAt).format('YYYY-MM-DD HH:mm:ss')
      : '',
  )
  const displayLastLoginAt = computed(() =>
    profile.value?.lastLoginAt
      ? dayjs(profile.value.lastLoginAt).format('YYYY-MM-DD HH:mm:ss')
      : '首次登录',
  )
  const avatarPreviewUrl = computed(() => {
    const formAvatar = form.values.avatar
    if (formAvatar && formAvatar !== '')
      return formAvatar
    return profile.value?.avatar ?? ''
  })

  async function loadProfile(options: { force?: boolean } = {}) {
    const { force = false } = options
    if (hasLoadedProfile.value && !force)
      return
    if (loadPromise && !force) {
      await loadPromise
      return
    }

    const task = (async () => {
      isLoadingProfile.value = true
      try {
        const res = await userApi.getProfile()
        profile.value = res
        userStore.setUser(res)

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

        hasLoadedProfile.value = true
      }
      catch (error) {
        console.error('加载用户信息失败', error)
      }
      finally {
        isLoadingProfile.value = false
      }
    })()

    loadPromise = task
    await task
    loadPromise = null
  }

  async function sendVerificationCode() {
    isSendingCode.value = true
    try {
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

  async function saveProfile(values: UpdateUserProfileReq) {
    isSavingProfile.value = true
    try {
      const updated = await userApi.updateProfile(values)
      profile.value = updated
      userStore.setUser(updated)

      toast.success('个人资料已更新')

      form.setFieldValue('newEmail', '')
      form.setFieldValue('newPassword', '')
      form.setFieldValue('confirmNewPassword', '')
      form.setFieldValue('verificationCode', '')

      hasLoadedProfile.value = true

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
    hasLoadedProfile,

    // 表单
    form,

    // 计算属性
    displayEmail,
    displayCreatedAt,
    displayLastLoginAt,
    avatarPreviewUrl,

    // 操作
    loadProfile,
    sendVerificationCode,
    saveProfile,
    uploadAvatar,
  }
}

export function useUserProfile() {
  if (!cachedState)
    cachedState = createUserProfileState()
  return cachedState
}
