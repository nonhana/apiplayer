import { PrismaClient } from '@prisma/client';

export interface UserPermissionContext {
  userId: string;
  teamId?: string;
  projectId?: string;
}

export interface PermissionCheck {
  resource: string;
  action: string;
}

export class PermissionService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 检查用户是否拥有特定权限
   * @param context 用户上下文
   * @param permission 权限检查
   * @returns 是否有权限
   */
  async hasPermission(
    context: UserPermissionContext,
    permission: PermissionCheck
  ): Promise<boolean> {
    const { userId, teamId, projectId } = context;
    const { resource, action } = permission;
    
    // 构建权限名称
    const permissionName = `${resource}:${action}`;
    
    try {
      // 获取用户在相关上下文中的角色
      const userRoles = await this.getUserRoles(userId, teamId, projectId);
      
      // 检查这些角色是否包含所需权限
      for (const role of userRoles) {
        const hasPermission = await this.roleHasPermission(role.id, permissionName);
        if (hasPermission) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('权限检查失败:', error);
      return false;
    }
  }

  /**
   * 批量检查用户权限
   * @param context 用户上下文
   * @param permissions 权限列表
   * @returns 权限检查结果映射
   */
  async hasPermissions(
    context: UserPermissionContext,
    permissions: PermissionCheck[]
  ): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const permission of permissions) {
      const key = `${permission.resource}:${permission.action}`;
      results[key] = await this.hasPermission(context, permission);
    }
    
    return results;
  }

  /**
   * 获取用户的所有权限
   * @param context 用户上下文
   * @returns 权限列表
   */
  async getUserPermissions(context: UserPermissionContext): Promise<string[]> {
    const { userId, teamId, projectId } = context;
    const permissions = new Set<string>();
    
    try {
      // 获取用户在相关上下文中的角色
      const userRoles = await this.getUserRoles(userId, teamId, projectId);
      
      // 收集所有角色的权限
      for (const role of userRoles) {
        const rolePermissions = await this.getRolePermissions(role.id);
        rolePermissions.forEach(p => permissions.add(p));
      }
      
      return Array.from(permissions);
    } catch (error) {
      console.error('获取用户权限失败:', error);
      return [];
    }
  }

  /**
   * 检查用户是否是团队成员
   * @param userId 用户ID
   * @param teamId 团队ID
   * @returns 是否是团队成员
   */
  async isTeamMember(userId: string, teamId: string): Promise<boolean> {
    const member = await this.prisma.teamMember.findUnique({
      where: {
        userId_teamId: { userId, teamId }
      }
    });
    return !!member;
  }

  /**
   * 检查用户是否是项目成员
   * @param userId 用户ID
   * @param projectId 项目ID
   * @returns 是否是项目成员
   */
  async isProjectMember(userId: string, projectId: string): Promise<boolean> {
    const member = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: { userId, projectId }
      }
    });
    return !!member;
  }

  /**
   * 获取用户在特定上下文中的角色
   * @param userId 用户ID
   * @param teamId 团队ID（可选）
   * @param projectId 项目ID（可选）
   * @returns 角色列表
   */
  private async getUserRoles(
    userId: string,
    teamId?: string,
    projectId?: string
  ): Promise<Array<{ id: string; name: string }>> {
    const roles: Array<{ id: string; name: string }> = [];
    
    // 获取团队角色
    if (teamId) {
      const teamMember = await this.prisma.teamMember.findUnique({
        where: {
          userId_teamId: { userId, teamId }
        },
        include: {
          role: true
        }
      });
      
      if (teamMember) {
        roles.push(teamMember.role);
      }
    }
    
    // 获取项目角色（如果有项目ID且用户是项目成员）
    if (projectId) {
      const projectMember = await this.prisma.projectMember.findUnique({
        where: {
          userId_projectId: { userId, projectId }
        },
        include: {
          role: true
        }
      });
      
      if (projectMember) {
        roles.push(projectMember.role);
      }
    }
    
    return roles;
  }

  /**
   * 检查角色是否拥有特定权限
   * @param roleId 角色ID
   * @param permissionName 权限名称
   * @returns 是否拥有权限
   */
  private async roleHasPermission(roleId: string, permissionName: string): Promise<boolean> {
    const rolePermission = await this.prisma.rolePermission.findFirst({
      where: {
        roleId,
        permission: {
          name: permissionName
        }
      }
    });
    
    return !!rolePermission;
  }

  /**
   * 获取角色的所有权限
   * @param roleId 角色ID
   * @returns 权限名称列表
   */
  private async getRolePermissions(roleId: string): Promise<string[]> {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { roleId },
      include: {
        permission: true
      }
    });
    
    return rolePermissions.map(rp => rp.permission.name);
  }
}

// 权限装饰器函数，用于方法级别的权限控制
export function RequirePermission(resource: string, action: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      // 假设第一个参数包含用户上下文
      const context = args[0] as UserPermissionContext;
      const permissionService = new PermissionService(this.prisma);
      
      const hasPermission = await permissionService.hasPermission(
        context,
        { resource, action }
      );
      
      if (!hasPermission) {
        throw new Error(`权限不足: 需要 ${resource}:${action} 权限`);
      }
      
      return method.apply(this, args);
    };
  };
}

// 常用权限检查的快捷方法
export class PermissionHelpers {
  constructor(private permissionService: PermissionService) {}

  // API 相关权限检查
  async canReadAPI(userId: string, projectId: string): Promise<boolean> {
    return this.permissionService.hasPermission(
      { userId, projectId },
      { resource: 'api', action: 'read' }
    );
  }

  async canWriteAPI(userId: string, projectId: string): Promise<boolean> {
    return this.permissionService.hasPermission(
      { userId, projectId },
      { resource: 'api', action: 'write' }
    );
  }

  async canCreateAPI(userId: string, projectId: string): Promise<boolean> {
    return this.permissionService.hasPermission(
      { userId, projectId },
      { resource: 'api', action: 'create' }
    );
  }

  async canDeleteAPI(userId: string, projectId: string): Promise<boolean> {
    return this.permissionService.hasPermission(
      { userId, projectId },
      { resource: 'api', action: 'delete' }
    );
  }

  async canPublishAPI(userId: string, projectId: string): Promise<boolean> {
    return this.permissionService.hasPermission(
      { userId, projectId },
      { resource: 'api', action: 'publish' }
    );
  }

  // 项目相关权限检查
  async canManageProject(userId: string, teamId: string, projectId: string): Promise<boolean> {
    return this.permissionService.hasPermission(
      { userId, teamId, projectId },
      { resource: 'project', action: 'admin' }
    );
  }

  async canInviteProjectMember(userId: string, teamId: string, projectId: string): Promise<boolean> {
    return this.permissionService.hasPermission(
      { userId, teamId, projectId },
      { resource: 'project', action: 'member:invite' }
    );
  }

  // 团队相关权限检查
  async canManageTeam(userId: string, teamId: string): Promise<boolean> {
    return this.permissionService.hasPermission(
      { userId, teamId },
      { resource: 'team', action: 'admin' }
    );
  }

  async canInviteTeamMember(userId: string, teamId: string): Promise<boolean> {
    return this.permissionService.hasPermission(
      { userId, teamId },
      { resource: 'team', action: 'member:invite' }
    );
  }
} 