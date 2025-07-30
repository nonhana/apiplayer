import process from 'node:process'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始种子数据初始化...')

  // 1. 创建基础权限
  const permissions = [
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
  ]

  console.log('📝 创建权限...')
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    })
  }

  // 2. 创建系统角色
  const roles = [
    // 团队角色
    {
      name: 'team:owner',
      description: '团队所有者',
      isSystem: true,
      permissions: [
        'team:read',
        'team:write',
        'team:admin',
        'team:member:invite',
        'team:member:remove',
        'team:member:manage',
        'project:read',
        'project:write',
        'project:admin',
        'project:create',
        'project:member:invite',
        'project:member:remove',
        'project:member:manage',
        'project:env:manage',
        'api:read',
        'api:write',
        'api:create',
        'api:delete',
        'api:publish',
        'api:version:manage',
        'api:mock:manage',
        'api:test',
        'api_group:read',
        'api_group:write',
        'api_group:create',
        'api_group:delete',
        'global_param:read',
        'global_param:write',
        'global_param:manage',
        'system:log:read',
      ],
    },
    {
      name: 'team:admin',
      description: '团队管理员',
      isSystem: true,
      permissions: [
        'team:read',
        'team:write',
        'team:admin', // ✅ 添加缺失的权限
        'team:member:invite',
        'team:member:remove',
        'team:member:manage',
        'project:read',
        'project:write',
        'project:create',
        'project:member:invite',
        'project:member:remove',
        'project:member:manage',
        'project:env:manage',
        'api:read',
        'api:write',
        'api:create',
        'api:delete',
        'api:publish',
        'api:version:manage',
        'api:mock:manage',
        'api:test',
        'api_group:read',
        'api_group:write',
        'api_group:create',
        'api_group:delete',
        'global_param:read',
        'global_param:write',
        'global_param:manage',
      ],
    },
    {
      name: 'team:member',
      description: '团队成员',
      isSystem: true,
      permissions: [
        'team:read',
        'project:read',
        'project:create',
        'api:read',
        'api:write',
        'api:create',
        'api:mock:manage',
        'api:test',
        'api_group:read',
        'api_group:write',
        'api_group:create',
        'global_param:read',
      ],
    },
    {
      name: 'team:guest',
      description: '团队访客',
      isSystem: true,
      permissions: [
        'team:read',
        'project:read',
        'api:read',
        'api:test',
        'api_group:read',
        'global_param:read',
      ],
    },

    // 项目角色
    {
      name: 'project:admin',
      description: '项目管理员',
      isSystem: true,
      permissions: [
        'project:read',
        'project:write',
        'project:admin',
        'project:member:invite',
        'project:member:remove',
        'project:member:manage',
        'project:env:manage',
        'api:read',
        'api:write',
        'api:create',
        'api:delete',
        'api:publish',
        'api:version:manage',
        'api:mock:manage',
        'api:test',
        'api_group:read',
        'api_group:write',
        'api_group:create',
        'api_group:delete',
        'global_param:read',
        'global_param:write',
        'global_param:manage',
      ],
    },
    {
      name: 'project:editor',
      description: '项目编辑者',
      isSystem: true,
      permissions: [
        'project:read',
        'project:write',
        'api:read',
        'api:write',
        'api:create',
        'api:publish',
        'api:version:manage',
        'api:mock:manage',
        'api:test',
        'api_group:read',
        'api_group:write',
        'api_group:create',
        'global_param:read',
        'global_param:write',
      ],
    },
    {
      name: 'project:viewer',
      description: '项目查看者',
      isSystem: true,
      permissions: [
        'project:read',
        'api:read',
        'api:test',
        'api_group:read',
        'global_param:read',
      ],
    },

    // 系统角色（可选）
    {
      name: 'system:admin',
      description: '系统管理员',
      isSystem: true,
      permissions: [
        'system:config:read',
        'system:config:write',
        'system:log:read',
        'system:user:manage',
        'team:read',
        'team:write',
        'team:admin',
        'project:read',
        'project:write',
        'project:admin',
        'api:read',
        'api:write',
        'api:create',
        'api:delete',
        'api:publish',
        'api:version:manage',
      ],
    },
  ]

  console.log('👑 创建角色...')
  for (const roleData of roles) {
    const { permissions: permissionNames, ...roleInfo } = roleData

    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: {},
      create: roleInfo,
    })

    // 分配权限给角色
    for (const permissionName of permissionNames) {
      const permission = await prisma.permission.findUnique({
        where: { name: permissionName },
      })

      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permission.id,
          },
        })
      }
    }
  }

  // 3. 创建系统配置
  const systemConfigs = [
    {
      key: 'registration.enabled',
      value: true,
      description: '是否允许用户注册',
    },
    {
      key: 'registration.email_verification',
      value: false,
      description: '注册时是否需要邮箱验证',
    },
    {
      key: 'team.max_members',
      value: 50,
      description: '团队最大成员数量',
    },
    {
      key: 'project.max_apis',
      value: 1000,
      description: '单个项目最大 API 数量',
    },
    {
      key: 'api.max_versions',
      value: 100,
      description: '单个 API 最大版本数量',
    },
    {
      key: 'version.auto_increment',
      value: true,
      description: '是否自动递增版本号',
    },
  ]

  console.log('⚙️ 创建系统配置...')
  for (const config of systemConfigs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    })
  }

  console.log('✅ 种子数据初始化完成！')
  console.log(`
📊 数据统计:
- 权限: ${permissions.length} 个
- 角色: ${roles.length} 个  
- 系统配置: ${systemConfigs.length} 个

🎯 主要角色说明:
- team:owner      - 团队所有者，拥有所有权限
- team:admin      - 团队管理员，可以管理团队和项目
- team:member     - 团队成员，可以创建和编辑项目
- team:guest      - 团队访客，只能查看
- project:admin   - 项目管理员，可以管理项目内所有内容
- project:editor  - 项目编辑者，可以编辑 API 文档
- project:viewer  - 项目查看者，只能查看项目内容
- system:admin    - 系统管理员，拥有系统级权限

🔐 权限体系说明:
- 团队权限: 管理团队信息、成员、项目创建
- 项目权限: 管理项目信息、成员、环境配置
- API权限: CRUD操作、版本管理、Mock数据、测试
- 系统权限: 系统配置、日志查看、用户管理
- 全局参数权限: 管理项目级全局参数

🔄 版本控制特性:
- 完整的快照版本存储
- 精确的变更记录追踪  
- 灵活的版本状态管理 (DRAFT/CURRENT/ARCHIVED)
- 支持版本比较和回滚
- 完整的操作审计日志

✨ 权限设计亮点:
- 细粒度的资源访问控制
- 分层的角色权限体系
- 支持团队和项目双重层级
- 完整的 CRUD 权限覆盖
- 扩展性强的权限模型
  `)
}

main()
  .catch((e) => {
    console.error('❌ 种子数据初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
