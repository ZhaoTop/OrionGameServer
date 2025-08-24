import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { apiService } from '@/api';
import type { LoginCredentials, User } from '@/types/auth';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'));
  const user = ref<User | null>(null);
  const loading = ref(false);

  const isAuthenticated = computed(() => !!token.value);

  const login = async (credentials: LoginCredentials) => {
    loading.value = true;
    try {
      const response = await apiService.login(credentials);
      if (response.success) {
        token.value = response.data.token;
        user.value = response.data.user;
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        return { success: true };
      }
      return { success: false, message: '登录失败' };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.message || '登录失败，请稍后重试' 
      };
    } finally {
      loading.value = false;
    }
  };

  const logout = () => {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  };

  const checkAuth = async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) return false;

    try {
      // 验证token是否有效
      const response = await apiService.getCurrentUser();
      if (response.success) {
        token.value = storedToken;
        user.value = response.data.user;
        return true;
      }
    } catch {
      // token无效，清除本地存储
      logout();
    }
    return false;
  };

  const refreshToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    try {
      const response = await apiService.refreshToken(refreshToken);
      if (response.success) {
        token.value = response.data.token;
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        return true;
      }
    } catch {
      logout();
    }
    return false;
  };

  return {
    token,
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    checkAuth,
    refreshToken
  };
});