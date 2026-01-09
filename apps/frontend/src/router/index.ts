import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'
import { AUTH_REDIRECT_ROUTES, PUBLIC_ROUTES } from '@/constants'
import { useUserStore } from '@/stores/useUserStore'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/home/HomeView.vue'),
  },
  {
    path: '/auth',
    component: () => import('@/layouts/AuthLayout.vue'),
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
    path: '/dashboard',
    component: () => import('@/layouts/DashboardLayout.vue'),
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/ProjectListView.vue'),
      },
      {
        path: 'profile',
        name: 'UserProfile',
        component: () => import('@/views/dashboard/UserProfileView.vue'),
      },
    ],
  },
  {
    path: '/project/:projectId',
    component: () => import('@/layouts/WorkbenchLayout.vue'),
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
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _, next) => {
  const userStore = useUserStore()
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
})

export default router
