// src/constants/index.ts
// 存放一些常量

/**
 * 隐藏头部导航的路由名称
 */
export const PUBLIC_ROUTES = ['Login', 'Register', 'Home', 'NotFound', 'Workbench']

/**
 * 项目可见性
 */
export const PROJECT_VISIBILITY = ['all', 'public', 'private'] as const
export type ProjectVisibility = typeof PROJECT_VISIBILITY[number]
