export enum UserRole {
  GUEST = 'guest',
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

export const UserRoleDescription = {
  [UserRole.GUEST]: '游客用户',
  [UserRole.USER]: '注册用户',
  [UserRole.ADMIN]: '管理员',
  [UserRole.SUPER_ADMIN]: '超级管理员'
};