import type { Component } from 'vue'
import type { TabPageItem } from '@/types'
import { Palette } from 'lucide-vue-next'
import AppearancePanel from './menu/Appearance.vue'

export interface SettingsMenuItem extends TabPageItem<string> {
  component: Component
}

export const SETTINGS_MENU_ITEMS: SettingsMenuItem[] = [
  {
    value: 'appearance',
    label: '外观',
    icon: Palette,
    component: AppearancePanel,
  },
]
