import type { Component } from 'vue'
import type { TabPageItem } from '@/types'
import { Info, Palette, Settings, Shield, User } from 'lucide-vue-next'
import AboutPanel from './menu/About.vue'
import AccountPanel from './menu/Account.vue'
import AppearancePanel from './menu/Appearance.vue'
import ProfilePanel from './menu/Profile.vue'
import SystemPanel from './menu/System.vue'

export interface SettingsMenuItem extends TabPageItem<string> {
  component: Component
  /** 是否仅管理员可见 */
  adminOnly?: boolean
}

/** 通用设置菜单项（所有用户可见） */
export const COMMON_SETTINGS_MENU_ITEMS: SettingsMenuItem[] = [
  {
    value: 'profile',
    label: '个人资料',
    icon: User,
    component: ProfilePanel,
  },
  {
    value: 'account',
    label: '账号安全',
    icon: Shield,
    component: AccountPanel,
  },
  {
    value: 'appearance',
    label: '外观',
    icon: Palette,
    component: AppearancePanel,
  },
  {
    value: 'about',
    label: '关于',
    icon: Info,
    component: AboutPanel,
  },
]

/** 管理员专属设置菜单项 */
export const ADMIN_SETTINGS_MENU_ITEMS: SettingsMenuItem[] = [
  {
    value: 'system',
    label: '系统设置',
    icon: Settings,
    component: SystemPanel,
    adminOnly: true,
  },
]

/**
 * 获取设置菜单项
 * @param isAdmin 是否为系统管理员
 */
export function getSettingsMenuItems(isAdmin: boolean): SettingsMenuItem[] {
  if (isAdmin) {
    return [...COMMON_SETTINGS_MENU_ITEMS, ...ADMIN_SETTINGS_MENU_ITEMS]
  }
  return COMMON_SETTINGS_MENU_ITEMS
}

/** @deprecated 使用 getSettingsMenuItems 替代 */
export const SETTINGS_MENU_ITEMS: SettingsMenuItem[] = COMMON_SETTINGS_MENU_ITEMS
