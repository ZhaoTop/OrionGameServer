// 认证相关类型
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface User {
  id: string;
  username?: string;
  isGuest: boolean;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
    refreshToken: string;
  };
}

// 用户管理相关类型
export interface UserListQuery {
  page?: number;
  limit?: number;
  username?: string;
  isGuest?: boolean;
  isActive?: boolean;
}

export interface UserDetail {
  id: string;
  username?: string;
  email?: string;
  isGuest: boolean;
  isActive: boolean;
  level: number;
  experience: number;
  coins: number;
  gems: number;
  totalPlayTime: number;
  gamesPlayed: number;
  gamesWon: number;
  consecutiveLoginDays: number;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserListResponse {
  success: boolean;
  data: {
    users: UserDetail[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

// 统计数据相关类型
export interface GameStats {
  totalUsers: number;
  activeUsers: number;
  guestUsers: number;
  registeredUsers: number;
  todayNewUsers: number;
  totalGames: number;
  todayGames: number;
  avgGameDuration: number;
}

export interface RetentionStats {
  day1Retention: number;
  day3Retention: number;
  day7Retention: number;
  day30Retention: number;
}