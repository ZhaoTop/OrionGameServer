<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h2>数据概览</h2>
      <p>游戏服务器运营数据统计</p>
    </div>

    <!-- 核心数据卡片 -->
    <el-row :gutter="24" class="stats-cards">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon users-icon">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatNumber(gameStats?.totalUsers) }}</div>
              <div class="stat-label">总用户数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon active-icon">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatNumber(gameStats?.activeUsers) }}</div>
              <div class="stat-label">活跃用户</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon games-icon">
              <el-icon><Trophy /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatNumber(gameStats?.totalGames) }}</div>
              <div class="stat-label">总游戏次数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon new-icon">
              <el-icon><UserFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatNumber(gameStats?.todayNewUsers) }}</div>
              <div class="stat-label">今日新增</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 详细统计 -->
    <el-row :gutter="24" class="detail-section">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>用户类型分布</span>
            </div>
          </template>
          <div class="user-distribution">
            <div class="distribution-item">
              <div class="item-label">注册用户</div>
              <div class="item-value">
                {{ formatNumber(gameStats?.registeredUsers) }}
                <span class="percentage">
                  ({{ calculatePercentage(gameStats?.registeredUsers, gameStats?.totalUsers) }}%)
                </span>
              </div>
            </div>
            <div class="distribution-item">
              <div class="item-label">游客用户</div>
              <div class="item-value">
                {{ formatNumber(gameStats?.guestUsers) }}
                <span class="percentage">
                  ({{ calculatePercentage(gameStats?.guestUsers, gameStats?.totalUsers) }}%)
                </span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>用户留存率</span>
            </div>
          </template>
          <div class="retention-stats">
            <div class="retention-item">
              <div class="retention-label">次日留存</div>
              <div class="retention-value">{{ formatPercentage(retentionStats?.day1Retention) }}</div>
            </div>
            <div class="retention-item">
              <div class="retention-label">3日留存</div>
              <div class="retention-value">{{ formatPercentage(retentionStats?.day3Retention) }}</div>
            </div>
            <div class="retention-item">
              <div class="retention-label">7日留存</div>
              <div class="retention-value">{{ formatPercentage(retentionStats?.day7Retention) }}</div>
            </div>
            <div class="retention-item">
              <div class="retention-label">30日留存</div>
              <div class="retention-value">{{ formatPercentage(retentionStats?.day30Retention) }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快速操作 -->
    <el-row :gutter="24" class="quick-actions">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>快速操作</span>
            </div>
          </template>
          <div class="actions-content">
            <el-button type="primary" @click="$router.push('/users')">
              <el-icon><User /></el-icon>
              用户管理
            </el-button>
            <el-button type="success" @click="$router.push('/analytics')">
              <el-icon><DataAnalysis /></el-icon>
              数据分析
            </el-button>
            <el-button type="info" @click="openSwaggerDocs">
              <el-icon><Document /></el-icon>
              API文档
            </el-button>
            <el-button type="warning" @click="refreshData">
              <el-icon><Refresh /></el-icon>
              刷新数据
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { apiService } from '@/api';
import type { GameStats, RetentionStats } from '@/types/auth';

const gameStats = ref<GameStats>();
const retentionStats = ref<RetentionStats>();
const loading = ref(false);

const formatNumber = (num?: number) => {
  if (!num) return '0';
  return num.toLocaleString();
};

const formatPercentage = (num?: number) => {
  if (!num) return '0%';
  return `${(num * 100).toFixed(1)}%`;
};

const calculatePercentage = (value?: number, total?: number) => {
  if (!value || !total || total === 0) return '0';
  return ((value / total) * 100).toFixed(1);
};

const loadGameStats = async () => {
  try {
    const response = await apiService.getGameStats();
    if (response.success) {
      gameStats.value = response.data;
    }
  } catch (error) {
    ElMessage.error('获取游戏统计数据失败');
  }
};

const loadRetentionStats = async () => {
  try {
    const response = await apiService.getRetentionStats();
    if (response.success) {
      retentionStats.value = response.data;
    }
  } catch (error) {
    ElMessage.error('获取留存统计数据失败');
  }
};

const refreshData = async () => {
  loading.value = true;
  try {
    await Promise.all([loadGameStats(), loadRetentionStats()]);
    ElMessage.success('数据刷新成功');
  } catch (error) {
    ElMessage.error('数据刷新失败');
  } finally {
    loading.value = false;
  }
};

const openSwaggerDocs = () => {
  window.open('/api/docs', '_blank');
};

onMounted(() => {
  refreshData();
});
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.dashboard-header {
  margin-bottom: 24px;
}

.dashboard-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #333;
}

.dashboard-header p {
  margin: 0;
  color: #666;
}

.stats-cards {
  margin-bottom: 24px;
}

.stat-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.users-icon {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.active-icon {
  background: linear-gradient(135deg, #f093fb, #f5576c);
}

.games-icon {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
}

.new-icon {
  background: linear-gradient(135deg, #43e97b, #38f9d7);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.detail-section {
  margin-bottom: 24px;
}

.card-header {
  font-weight: bold;
  font-size: 16px;
}

.user-distribution,
.retention-stats {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.distribution-item,
.retention-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.item-label,
.retention-label {
  font-weight: 500;
  color: #333;
}

.item-value,
.retention-value {
  font-weight: bold;
  color: #1890ff;
}

.percentage {
  color: #666;
  font-weight: normal;
  font-size: 12px;
}

.quick-actions {
  margin-bottom: 24px;
}

.actions-content {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

:deep(.el-card__body) {
  padding: 20px;
}
</style>