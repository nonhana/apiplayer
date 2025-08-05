export const permissions = [
  // 团队权限
  { name: 'team:read', description: '查看团队信息', resource: 'team', action: 'read' },
  { name: 'team:write', description: '编辑团队信息', resource: 'team', action: 'write' },
  { name: 'team:admin', description: '管理团队（删除、转让等）', resource: 'team', action: 'admin' },
  { name: 'team:member:invite', description: '邀请团队成员', resource: 'team', action: 'member:invite' },
  { name: 'team:member:remove', description: '移除团队成员', resource: 'team', action: 'member:remove' },
  { name: 'team:member:manage', description: '管理团队成员角色', resource: 'team', action: 'member:manage' },

  // 项目权限
  { name: 'project:read', description: '查看项目', resource: 'project', action: 'read' },
  { name: 'project:write', description: '编辑项目信息', resource: 'project', action: 'write' },
  { name: 'project:admin', description: '管理项目（删除、转让等）', resource: 'project', action: 'admin' },
  { name: 'project:create', description: '创建项目', resource: 'project', action: 'create' },
  { name: 'project:member:invite', description: '邀请项目成员', resource: 'project', action: 'member:invite' },
  { name: 'project:member:remove', description: '移除项目成员', resource: 'project', action: 'member:remove' },
  { name: 'project:member:manage', description: '管理项目成员角色', resource: 'project', action: 'member:manage' },
  { name: 'project:env:manage', description: '管理项目环境', resource: 'project', action: 'env:manage' },

  // API 权限
  { name: 'api:read', description: '查看 API', resource: 'api', action: 'read' },
  { name: 'api:write', description: '编辑 API', resource: 'api', action: 'write' },
  { name: 'api:create', description: '创建 API', resource: 'api', action: 'create' },
  { name: 'api:delete', description: '删除 API', resource: 'api', action: 'delete' },
  { name: 'api:publish', description: '发布 API', resource: 'api', action: 'publish' },
  { name: 'api:version:manage', description: '管理 API 版本', resource: 'api', action: 'version:manage' },
  { name: 'api:mock:manage', description: '管理 API Mock 数据', resource: 'api', action: 'mock:manage' },
  { name: 'api:test', description: '测试 API', resource: 'api', action: 'test' },

  // API 分组权限
  { name: 'api_group:read', description: '查看 API 分组', resource: 'api_group', action: 'read' },
  { name: 'api_group:write', description: '编辑 API 分组', resource: 'api_group', action: 'write' },
  { name: 'api_group:create', description: '创建 API 分组', resource: 'api_group', action: 'create' },
  { name: 'api_group:delete', description: '删除 API 分组', resource: 'api_group', action: 'delete' },

  // 系统权限
  { name: 'system:config:read', description: '查看系统配置', resource: 'system', action: 'config:read' },
  { name: 'system:config:write', description: '修改系统配置', resource: 'system', action: 'config:write' },
  { name: 'system:log:read', description: '查看系统日志', resource: 'system', action: 'log:read' },
  { name: 'system:user:manage', description: '管理系统用户', resource: 'system', action: 'user:manage' },

  // 全局参数权限
  { name: 'global_param:read', description: '查看全局参数', resource: 'global_param', action: 'read' },
  { name: 'global_param:write', description: '编辑全局参数', resource: 'global_param', action: 'write' },
  { name: 'global_param:manage', description: '管理全局参数', resource: 'global_param', action: 'manage' },
] as const

export type PermissionType = (typeof permissions)[number]['name']
