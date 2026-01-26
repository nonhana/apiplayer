import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'
import { toast } from 'vue-sonner'
import { AUTH_REDIRECT_ROUTES, PUBLIC_ROUTES } from '@/constants'
import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/home/HomeView.vue'),
    meta: { layout: 'empty' },
  },
  {
    path: '/auth',
    component: () => import('@/layouts/AuthLayout.vue'),
    meta: { layout: 'empty' },
    children: [
      {
        path: '',
        redirect: '/auth/login',
      },
      {
        path: 'login',
        name: 'Login',
        component: () => import('@/views/auth/LoginView.vue'),
      },
      {
        path: 'register',
        name: 'Register',
        component: () => import('@/views/auth/RegisterView.vue'),
      },
    ],
  },
  {
    path: '/invite/accept',
    name: 'AcceptInvite',
    component: () => import('@/views/invite/AcceptInviteView.vue'),
    meta: { layout: 'empty' },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/dashboard/DashboardView.vue'),
    meta: { layout: 'main' },
  },
  {
    path: '/project/:projectId',
    component: () => import('@/layouts/WorkbenchLayout.vue'),
    meta: { layout: 'main' },
    children: [
      {
        path: '',
        name: 'Workbench',
        component: () => import('@/views/workbench/WorkbenchView.vue'),
      },
      {
        path: ':apiId',
        name: 'ApiDetail',
        component: () => import('@/views/workbench/ApiDetailView.vue'),
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/not-found/NotFoundView.vue'),
    meta: { layout: 'empty' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, _, next) => {
  const userStore = useUserStore()
  const globalStore = useGlobalStore()

  const isPublicRoute = PUBLIC_ROUTES.includes(to.name as string)
  const shouldRedirectToDashboard = AUTH_REDIRECT_ROUTES.includes(to.name as string)

  // 0. 如果本地有认证状态但尚未验证，先验证 Session 有效性
  if (userStore.isAuthenticated && !userStore.getIsSessionVerified()) {
    await userStore.verifySession()
  }

  // 1. 已认证用户访问登录/注册等页面 → 重定向到 Dashboard
  if (userStore.isAuthenticated && shouldRedirectToDashboard) {
    return next({ name: 'Dashboard' })
  }

  // 2. 注册页面但注册功能已关闭 → 重定向到登录
  if (to.name === 'Register' && !globalStore.systemConfig.register_enabled) {
    toast.error('注册功能已关闭', { description: '请联系管理员注册新账号' })
    return next({ name: 'Login' })
  }

  // 3. 公开路由 → 直接放行
  if (isPublicRoute) {
    return next()
  }

  // 4. 已认证用户 → 放行
  if (userStore.isAuthenticated) {
    return next()
  }

  // 5. 未认证用户访问受保护路由 → 重定向到登录
  return next({ name: 'Login', query: { redirect: to.fullPath } })
})

export default router
