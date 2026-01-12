// src/constants/index.ts
// 存放一些常量

/**
 * 公共路由
 */
export const PUBLIC_ROUTES = ['Login', 'Register', 'Home', 'NotFound', 'AcceptInvite']

/**
 * 已登录用户应该跳转到 Dashboard 的路由
 */
export const AUTH_REDIRECT_ROUTES = ['Home', 'Login', 'Register']

/**
 * 项目可见性
 */
export const PROJECT_VISIBILITY = ['all', 'public', 'private'] as const
export type ProjectVisibility = typeof PROJECT_VISIBILITY[number]
