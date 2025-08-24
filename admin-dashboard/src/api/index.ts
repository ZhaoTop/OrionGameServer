import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import type { 
  LoginCredentials, 
  AuthResponse, 
  UserListQuery, 
  UserListResponse,
  GameStats,
  RetentionStats,
  UserDetail
} from '@/types/auth';

class ApiService {
  private http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: '/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器
    this.http.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.http.interceptors.response.use(
      (response: AxiosResponse) => response.data,
      async (error) => {
        if (error.response?.status === 401) {
          // Token过期，尝试刷新
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            try {
              const response = await this.refreshToken(refreshToken);
              if (response.success) {
                // 重新发起请求
                const originalRequest = error.config;
                originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
                return this.http(originalRequest);
              }
            } catch {
              // 刷新失败，跳转到登录页
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              window.location.href = '/login';
            }
          } else {
            // 没有refresh token，直接跳转登录
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // 认证相关
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return this.http.post('/auth/login', credentials);
  }

  async refreshToken(refreshToken: string): Promise<any> {
    return this.http.post('/auth/refresh-token', { refreshToken });
  }

  async getCurrentUser(): Promise<any> {
    // 这里应该有个获取当前用户信息的接口
    // 暂时返回模拟数据
    return {
      success: true,
      data: {
        user: {
          id: '1',
          username: 'admin',
          isGuest: false
        }
      }
    };
  }

  // 管理后台相关
  async getUserList(query: UserListQuery): Promise<UserListResponse> {
    return this.http.get('/admin/users', { params: query });
  }

  async getUserDetail(userId: string): Promise<{ success: boolean; data: { user: UserDetail } }> {
    return this.http.get(`/admin/users/${userId}`);
  }

  async updateUserStatus(userId: string, isActive: boolean): Promise<any> {
    return this.http.patch(`/admin/users/${userId}/status`, { isActive });
  }

  async deleteUser(userId: string): Promise<any> {
    return this.http.delete(`/admin/users/${userId}`);
  }

  async getGameStats(): Promise<{ success: boolean; data: GameStats }> {
    return this.http.get('/admin/stats/game');
  }

  async getRetentionStats(): Promise<{ success: boolean; data: RetentionStats }> {
    return this.http.get('/admin/stats/retention');
  }

  // 健康检查
  async healthCheck(): Promise<any> {
    return this.http.get('/health');
  }
}

export const apiService = new ApiService();