import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    redirect: '/dashboard',
    component: () => import('@/views/Layout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard/Dashboard.vue'),
        meta: { title: '仪表板', icon: 'Dashboard' }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/User/UserList.vue'),
        meta: { title: '用户管理', icon: 'User' }
      },
      {
        path: 'users/:id',
        name: 'UserDetail',
        component: () => import('@/views/User/UserDetail.vue'),
        meta: { title: '用户详情', hidden: true }
      },
      {
        path: 'analytics',
        name: 'Analytics',
        component: () => import('@/views/Analytics/Analytics.vue'),
        meta: { title: '数据分析', icon: 'DataAnalysis' }
      },
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/dashboard');
  } else {
    next();
  }
});

export default router;