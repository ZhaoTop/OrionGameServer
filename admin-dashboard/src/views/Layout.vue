<template>
  <div class="layout-container">
    <el-container>
      <el-aside :width="collapsed ? '64px' : '240px'" class="sidebar">
        <div class="sidebar-header">
          <div v-if="!collapsed" class="logo">
            <h3>OrionGameServer</h3>
          </div>
          <el-button 
            type="text" 
            :icon="collapsed ? 'Expand' : 'Fold'"
            @click="toggleSidebar"
            class="collapse-btn"
          />
        </div>
        
        <el-menu
          :default-active="currentRoute"
          class="sidebar-menu"
          :collapse="collapsed"
          :unique-opened="true"
          router
        >
          <template v-for="route in menuRoutes" :key="route.path">
            <el-menu-item
              v-if="!route.meta?.hidden"
              :index="route.path"
              @click="$router.push(route.path)"
            >
              <el-icon>
                <component :is="route.meta?.icon" />
              </el-icon>
              <template #title>{{ route.meta?.title }}</template>
            </el-menu-item>
          </template>
        </el-menu>
      </el-aside>
      
      <el-container>
        <el-header class="header">
          <div class="header-content">
            <div class="header-left">
              <el-breadcrumb separator="/" class="breadcrumb">
                <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
                <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
              </el-breadcrumb>
            </div>
            
            <div class="header-right">
              <el-dropdown>
                <div class="user-info">
                  <el-icon><User /></el-icon>
                  <span>{{ user?.username || 'Admin' }}</span>
                  <el-icon><ArrowDown /></el-icon>
                </div>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="handleLogout">
                      <el-icon><SwitchButton /></el-icon>
                      退出登录
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </el-header>
        
        <el-main class="main-content">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useAuthStore } from '@/store/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const collapsed = ref(false);
const user = computed(() => authStore.user);

const menuRoutes = [
  { path: '/dashboard', meta: { title: '仪表板', icon: 'Dashboard' } },
  { path: '/users', meta: { title: '用户管理', icon: 'User' } },
  { path: '/analytics', meta: { title: '数据分析', icon: 'DataAnalysis' } },
];

const currentRoute = computed(() => route.path);
const currentTitle = computed(() => {
  const matchedRoute = menuRoutes.find(r => r.path === route.path);
  return matchedRoute?.meta.title || '管理后台';
});

const toggleSidebar = () => {
  collapsed.value = !collapsed.value;
};

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    authStore.logout();
    ElMessage.success('已退出登录');
    router.push('/login');
  } catch {
    // 用户取消
  }
};
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background-color: #001529;
  transition: width 0.2s;
}

.sidebar-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid #1890ff;
}

.logo h3 {
  color: white;
  margin: 0;
  font-size: 16px;
}

.collapse-btn {
  color: white !important;
  border: none !important;
}

.sidebar-menu {
  border-right: none;
  background-color: #001529;
}

:deep(.el-menu-item) {
  color: rgba(255, 255, 255, 0.65);
}

:deep(.el-menu-item:hover) {
  color: #1890ff;
  background-color: rgba(24, 144, 255, 0.1);
}

:deep(.el-menu-item.is-active) {
  color: #1890ff;
  background-color: rgba(24, 144, 255, 0.2);
}

.header {
  background-color: white;
  border-bottom: 1px solid #e8e8e8;
  padding: 0;
}

.header-content {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.breadcrumb {
  font-size: 14px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #666;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.user-info:hover {
  background-color: #f5f5f5;
}

.main-content {
  padding: 20px;
  background-color: #f0f2f5;
}
</style>