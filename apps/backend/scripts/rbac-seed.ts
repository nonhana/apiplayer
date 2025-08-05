// It is best to run this file in place using bun

import process from 'node:process'
import { PrismaClient } from '@prisma/client'
import { permissions } from '../src/constants/permission'
import { roles } from '../src/constants/role'
import { systemConfigs } from '../src/constants/system-config'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始种子数据初始化...')

  // 1. 创建基础权限
  console.log('📝 创建权限...')
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    })
  }

  // 2. 创建系统角色
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
  console.log('⚙️ 创建系统配置...')
  for (const config of systemConfigs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    })
  }

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

🔥 认证系统功能:
- 用户注册和登录
- 基于 Redis 的 Session 管理
- 密码安全哈希存储
- 会话固定攻击防护
- 多设备会话管理
- 用户名和邮箱唯一性验证

💡 使用提示:
1. 登录测试: 使用上述任意邮箱和对应密码进行登录
2. 注册测试: 可以尝试注册新用户来测试注册功能
3. 禁用账户: inactive@example.com 账户被禁用，可用于测试登录限制
4. 可用性检查: 可以测试邮箱和用户名的可用性检查功能
5. 会话管理: 登录后可以查看和管理活跃会话

🔧 开发建议:
• 生产环境请删除这些测试账户
• 建议为不同角色创建专门的测试账户
• 定期更新测试密码以保持安全
• 注册功能已集成完整的验证和初始化流程
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
