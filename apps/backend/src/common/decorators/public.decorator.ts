import { SetMetadata } from '@nestjs/common'

export const IS_PUBLIC_KEY = 'isPublic'

/** 公开路由装饰器，标记某个路由为公开路由，不进行权限验证 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
