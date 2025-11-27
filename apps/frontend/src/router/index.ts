import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'
import { PUBLIC_ROUTES } from '@/constants'
import { useUserStore } from '@/stores/useUserStore'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/home/HomeView.vue'),
  },
  {
    path: '/auth',
    component: () => import('../layouts/AuthLayout.vue'),
    children: [
      {
        path: '',
        redirect: '/auth/login',
      },
      {
        path: 'login',
        name: 'Login',
        component: () => import('../views/auth/LoginView.vue'),
      },
      {
        path: 'register',
        name: 'Register',
        component: () => import('../views/auth/RegisterView.vue'),
      },
    ],
  },
  {
    path: '/dashboard',
    component: () => import('../layouts/DashboardLayout.vue'),
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('../views/dashboard/ProjectListView.vue'),
      },
      {
        path: 'profile',
        name: 'UserProfile',
        component: () => import('../views/dashboard/UserProfileView.vue'),
      },
    ],
  },
  {
    path: '/project/:projectId',
    component: () => import('../layouts/WorkbenchLayout.vue'),
    children: [
      {
        path: '',
        name: 'Workbench',
        component: () => import('../views/workbench/WorkbenchView.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _, next) => {
  const userStore = useUserStore()
  if (PUBLIC_ROUTES.includes(to.name as string)) {
    next()
  }
  else {
    if (userStore.isAuthenticated) {
      next()
    }
    else {
      next({ name: 'Login' })
    }
  }
})

export default router
