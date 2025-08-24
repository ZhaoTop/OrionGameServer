import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/user-role.enum';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      throw new ForbiddenException('未找到用户信息');
    }

    if (!user.role) {
      throw new ForbiddenException('用户角色未设置');
    }

    // 检查用户角色权限
    const hasPermission = requiredRoles.some((role) => {
      switch (role) {
        case UserRole.SUPER_ADMIN:
          return user.role === UserRole.SUPER_ADMIN;
        case UserRole.ADMIN:
          return user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
        case UserRole.USER:
          return user.role === UserRole.USER || user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
        case UserRole.GUEST:
          return true; // 所有用户都可以访问游客权限
        default:
          return false;
      }
    });

    if (!hasPermission) {
      throw new ForbiddenException(`需要${requiredRoles.join('或')}权限才能访问此资源`);
    }

    return true;
  }
}