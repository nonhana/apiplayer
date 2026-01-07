import type { Component } from 'vue'

/** 基础分页查询参数 */
export interface BasePaginatedQuery {
  page?: number
  limit?: number
  search?: string
}

export interface Option {
  label: string
  value: string | number
}

export interface TabPageItem<T> {
  value: T
  label: string
  icon: Component
  disabled?: boolean
  [key: string]: any
}
