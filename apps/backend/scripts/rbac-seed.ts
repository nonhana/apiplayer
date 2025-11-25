// It is best to run this file in place using bun runtime

import process from 'node:process'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from 'prisma/generated/client'
import { permissions } from '../src/constants/permission'
import { roles } from '../src/constants/role'
import { systemConfigs } from '../src/constants/system-config'
import 'dotenv/config'

const connectionString = `${process.env.DATABASE_URL}`
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

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
