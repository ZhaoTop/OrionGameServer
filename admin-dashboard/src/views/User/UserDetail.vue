<template>
  <div class="user-detail">
    <div class="page-header">
      <el-button @click="$router.go(-1)" type="text">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <h2>用户详情</h2>
    </div>

    <div v-if="user" class="detail-content">
      <!-- 基本信息 -->
      <el-card class="info-card">
        <template #header>
          <span>基本信息</span>
        </template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="用户ID">{{ user.id }}</el-descriptions-item>
          <el-descriptions-item label="用户名">
            <span v-if="user.username">{{ user.username }}</span>
            <el-tag v-else type="info" size="small">游客用户</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="邮箱">
            <span v-if="user.email">{{ user.email }}</span>
            <span v-else class="text-placeholder">未设置</span>
          </el-descriptions-item>
          <el-descriptions-item label="用户类型">
            <el-tag :type="user.isGuest ? 'warning' : 'success'">
              {{ user.isGuest ? '游客用户' : '注册用户' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="账户状态">
            <el-tag :type="user.isActive ? 'success' : 'danger'">
              {{ user.isActive ? '正常' : '已禁用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="注册时间">
            {{ formatDateTime(user.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="最后登录">
            <span v-if="user.lastLoginAt">{{ formatDateTime(user.lastLoginAt) }}</span>
            <span v-else class="text-placeholder">从未登录</span>
          </el-descriptions-item>
          <el-descriptions-item label="最后更新">
            {{ formatDateTime(user.updatedAt) }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 游戏数据 -->
      <el-card class="game-data-card">
        <template #header>
          <span>游戏数据</span>
        </template>
        <el-row :gutter="24">
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-label">等级</div>
              <div class="stat-value level">{{ user.level }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-label">经验值</div>
              <div class="stat-value experience">{{ formatNumber(user.experience) }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-label">金币</div>
              <div class="stat-value coins">{{ formatNumber(user.coins) }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-label">宝石</div>
              <div class="stat-value gems">{{ formatNumber(user.gems) }}</div>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 游戏统计 -->
      <el-row :gutter="24">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>游戏统计</span>
            </template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="游戏次数">
                {{ formatNumber(user.gamesPlayed) }}
              </el-descriptions-item>
              <el-descriptions-item label="胜利次数">
                {{ formatNumber(user.gamesWon) }}
              </el-descriptions-item>
              <el-descriptions-item label="胜率">
                <span class="win-rate">
                  {{ calculateWinRate(user.gamesWon, user.gamesPlayed) }}%
                </span>
              </el-descriptions-item>
              <el-descriptions-item label="总游戏时长">
                {{ formatPlayTime(user.totalPlayTime) }}
              </el-descriptions-item>
              <el-descriptions-item label="平均游戏时长">
                {{ formatPlayTime(calculateAvgPlayTime(user.totalPlayTime, user.gamesPlayed)) }}
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>
        
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>活跃度统计</span>
            </template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="连续登录天数">
                <span class="consecutive-days">{{ user.consecutiveLoginDays }}天</span>
              </el-descriptions-item>
              <el-descriptions-item label="最后登录时间">
                <span v-if="user.lastLoginAt">{{ formatDateTime(user.lastLoginAt) }}</span>
                <span v-else class="text-placeholder">从未登录</span>
              </el-descriptions-item>
            </el-descriptions>
            
            <div class="user-actions">
              <el-button
                :type="user.isActive ? 'warning' : 'success'"
                @click="toggleUserStatus"
              >
                {{ user.isActive ? '禁用用户' : '启用用户' }}
              </el-button>
              <el-button type="danger" @click="deleteUser">
                删除用户
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <div v-else-if="!loading" class="not-found">
      <el-result icon="warning" title="用户不存在" sub-title="请检查用户ID是否正确">
        <template #extra>
          <el-button type="primary" @click="$router.push('/users')">
            返回用户列表
          </el-button>
        </template>
      </el-result>
    </div>

    <div v-if="loading" class="loading">
      <el-skeleton :rows="5" animated />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { apiService } from '@/api';
import type { UserDetail } from '@/types/auth';

const route = useRoute();
const router = useRouter();

const user = ref<UserDetail>();
const loading = ref(false);

const formatNumber = (num: number) => {
  return num.toLocaleString();
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN');
};

const formatPlayTime = (minutes: number) => {
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours}小时`;
  return `${hours}小时${remainingMinutes}分钟`;
};

const calculateWinRate = (won: number, total: number) => {
  if (total === 0) return '0.0';
  return ((won / total) * 100).toFixed(1);
};

const calculateAvgPlayTime = (totalTime: number, totalGames: number) => {
  if (totalGames === 0) return 0;
  return Math.round(totalTime / totalGames);
};

const loadUserDetail = async () => {
  const userId = route.params.id as string;
  loading.value = true;
  
  try {
    const response = await apiService.getUserDetail(userId);
    if (response.success) {
      user.value = response.data.user;
    }
  } catch (error) {
    ElMessage.error('获取用户详情失败');
  } finally {
    loading.value = false;
  }
};

const toggleUserStatus = async () => {
  if (!user.value) return;
  
  const action = user.value.isActive ? '禁用' : '启用';
  try {
    await ElMessageBox.confirm(
      `确定要${action}用户 ${user.value.username || user.value.id} 吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    const response = await apiService.updateUserStatus(user.value.id, !user.value.isActive);
    if (response.success) {
      ElMessage.success(`${action}成功`);
      user.value.isActive = !user.value.isActive;
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(`${action}失败`);
    }
  }
};

const deleteUser = async () => {
  if (!user.value) return;
  
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 ${user.value.username || user.value.id} 吗？此操作不可恢复！`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    );

    const response = await apiService.deleteUser(user.value.id);
    if (response.success) {
      ElMessage.success('删除成功');
      router.push('/users');
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

onMounted(() => {
  loadUserDetail();
});
</script>

<style scoped>
.user-detail {
  height: 100%;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.info-card,
.game-data-card {
  margin-bottom: 24px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
}

.stat-value.level {
  color: #722ed1;
}

.stat-value.experience {
  color: #1890ff;
}

.stat-value.coins {
  color: #faad14;
}

.stat-value.gems {
  color: #f759ab;
}

.win-rate {
  font-weight: bold;
  color: #52c41a;
}

.consecutive-days {
  font-weight: bold;
  color: #1890ff;
}

.text-placeholder {
  color: #c0c4cc;
}

.user-actions {
  margin-top: 20px;
  display: flex;
  gap: 12px;
}

.not-found,
.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
}

:deep(.el-descriptions__label) {
  width: 120px;
}
</style>