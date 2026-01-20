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

router.beforeEach((to, _, next) => {
  const userStore = useUserStore()
  const globalStore = useGlobalStore()

  const isPublicRoute = PUBLIC_ROUTES.includes(to.name as string)
  const goToDashboard = AUTH_REDIRECT_ROUTES.includes(to.name as string)

  if (userStore.isAuthenticated && goToDashboard) {
    next({ name: 'Dashboard' })
  }
  else if (isPublicRoute) {
    next()
  }
  else if (userStore.isAuthenticated) {
    next()
  }
  else {
    next({ name: 'Login' })
  }

  if (to.name === 'Register' && !globalStore.systemConfig.register_enabled) {
    next({ name: 'Login' })
    toast.error('注册功能已关闭', { description: '请联系管理员注册新账号' })
  }
  else {
    next()
  }
})

export default router
