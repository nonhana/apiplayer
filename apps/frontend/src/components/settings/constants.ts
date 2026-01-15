import type { Component } from 'vue'
import type { TabPageItem } from '@/types'
import { Palette, Shield, User } from 'lucide-vue-next'
import AccountPanel from './menu/Account.vue'
import AppearancePanel from './menu/Appearance.vue'
import ProfilePanel from './menu/Profile.vue'

export interface SettingsMenuItem extends TabPageItem<string> {
  component: Component
}

export const SETTINGS_MENU_ITEMS: SettingsMenuItem[] = [
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
]
