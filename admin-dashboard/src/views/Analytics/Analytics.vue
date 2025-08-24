<template>
  <div class="analytics">
    <div class="page-header">
      <h2>数据分析</h2>
      <p>深入了解用户行为和游戏运营数据</p>
    </div>

    <!-- 概览卡片 -->
    <el-row :gutter="24" class="overview-cards">
      <el-col :span="8">
        <el-card class="overview-card">
          <div class="card-content">
            <div class="metric-icon">
              <el-icon color="#1890ff"><TrendCharts /></el-icon>
            </div>
            <div class="metric-info">
              <div class="metric-title">用户留存分析</div>
              <div class="metric-desc">分析用户在不同时间段的留存情况</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="overview-card">
          <div class="card-content">
            <div class="metric-icon">
              <el-icon color="#52c41a"><DataAnalysis /></el-icon>
            </div>
            <div class="metric-info">
              <div class="metric-title">游戏数据统计</div>
              <div class="metric-desc">游戏次数、时长等核心指标</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="overview-card">
          <div class="card-content">
            <div class="metric-icon">
              <el-icon color="#faad14"><User /></el-icon>
            </div>
            <div class="metric-info">
              <div class="metric-title">用户行为分析</div>
              <div class="metric-desc">用户活跃度和参与度分析</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 详细统计 -->
    <el-row :gutter="24" class="detail-charts">
      <!-- 留存率图表 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="chart-header">
              <span>用户留存率</span>
              <el-button type="text" @click="refreshRetentionData">
                <el-icon><Refresh /></el-icon>
              </el-button>
            </div>
          </template>
          
          <div class="retention-chart">
            <div v-if="retentionStats" class="retention-bars">
              <div class="retention-item">
                <div class="retention-label">次日留存</div>
                <div class="retention-bar">
                  <div 
                    class="retention-fill day1"
                    :style="{ width: `${retentionStats.day1Retention * 100}%` }"
                  ></div>
                </div>
                <div class="retention-value">{{ formatPercentage(retentionStats.day1Retention) }}</div>
              </div>
              
              <div class="retention-item">
                <div class="retention-label">3日留存</div>
                <div class="retention-bar">
                  <div 
                    class="retention-fill day3"
                    :style="{ width: `${retentionStats.day3Retention * 100}%` }"
                  ></div>
                </div>
                <div class="retention-value">{{ formatPercentage(retentionStats.day3Retention) }}</div>
              </div>
              
              <div class="retention-item">
                <div class="retention-label">7日留存</div>
                <div class="retention-bar">
                  <div 
                    class="retention-fill day7"
                    :style="{ width: `${retentionStats.day7Retention * 100}%` }"
                  ></div>
                </div>
                <div class="retention-value">{{ formatPercentage(retentionStats.day7Retention) }}</div>
              </div>
              
              <div class="retention-item">
                <div class="retention-label">30日留存</div>
                <div class="retention-bar">
                  <div 
                    class="retention-fill day30"
                    :style="{ width: `${retentionStats.day30Retention * 100}%` }"
                  ></div>
                </div>
                <div class="retention-value">{{ formatPercentage(retentionStats.day30Retention) }}</div>
              </div>
            </div>
            
            <div v-if="loading" class="loading-skeleton">
              <el-skeleton :rows="4" animated />
            </div>
          </div>
        </el-card>
      </el-col>
      
      <!-- 用户分布图表 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="chart-header">
              <span>用户类型分布</span>
              <el-button type="text" @click="refreshGameStats">
                <el-icon><Refresh /></el-icon>
              </el-button>
            </div>
          </template>
          
          <div class="user-distribution">
            <div v-if="gameStats" class="distribution-chart">
              <div class="pie-container">
                <div class="pie-item registered">
                  <div class="pie-label">注册用户</div>
                  <div class="pie-value">{{ formatNumber(gameStats.registeredUsers) }}</div>
                  <div class="pie-percentage">
                    {{ calculatePercentage(gameStats.registeredUsers, gameStats.totalUsers) }}%
                  </div>
                </div>
                
                <div class="pie-item guest">
                  <div class="pie-label">游客用户</div>
                  <div class="pie-value">{{ formatNumber(gameStats.guestUsers) }}</div>
                  <div class="pie-percentage">
                    {{ calculatePercentage(gameStats.guestUsers, gameStats.totalUsers) }}%
                  </div>
                </div>
              </div>
              
              <div class="distribution-summary">
                <div class="summary-item">
                  <span class="summary-label">总用户数</span>
                  <span class="summary-value">{{ formatNumber(gameStats.totalUsers) }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">活跃用户</span>
                  <span class="summary-value">{{ formatNumber(gameStats.activeUsers) }}</span>
                </div>
              </div>
            </div>
            
            <div v-if="loading" class="loading-skeleton">
              <el-skeleton :rows="4" animated />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 详细数据表格 -->
    <el-card class="data-table">
      <template #header>
        <div class="chart-header">
          <span>详细数据报表</span>
          <div class="header-actions">
            <el-button type="primary" @click="exportData">
              <el-icon><Download /></el-icon>
              导出数据
            </el-button>
            <el-button @click="refreshAllData">
              <el-icon><Refresh /></el-icon>
              刷新数据
            </el-button>
          </div>
        </div>
      </template>
      
      <el-table :data="analyticsData" stripe style="width: 100%">
        <el-table-column prop="metric" label="指标" width="200" />
        <el-table-column prop="value" label="数值" width="150">
          <template #default="{ row }">
            <span class="metric-value">{{ row.value }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="说明" show-overflow-tooltip />
        <el-table-column prop="trend" label="趋势" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.trend === 'up'" type="success" size="small">
              <el-icon><TrendCharts /></el-icon> 上升
            </el-tag>
            <el-tag v-else-if="row.trend === 'down'" type="danger" size="small">
              <el-icon><TrendCharts /></el-icon> 下降
            </el-tag>
            <el-tag v-else type="info" size="small">
              <el-icon><Minus /></el-icon> 稳定
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { apiService } from '@/api';
import type { GameStats, RetentionStats } from '@/types/auth';

const loading = ref(false);
const gameStats = ref<GameStats>();
const retentionStats = ref<RetentionStats>();

interface AnalyticsDataItem {
  metric: string;
  value: string;
  description: string;
  trend: 'up' | 'down' | 'stable';
}

const analyticsData = ref<AnalyticsDataItem[]>([]);

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

const refreshRetentionData = async () => {
  loading.value = true;
  try {
    const response = await apiService.getRetentionStats();
    if (response.success) {
      retentionStats.value = response.data;
    }
  } catch (error) {
    ElMessage.error('获取留存数据失败');
  } finally {
    loading.value = false;
  }
};

const refreshGameStats = async () => {
  loading.value = true;
  try {
    const response = await apiService.getGameStats();
    if (response.success) {
      gameStats.value = response.data;
    }
  } catch (error) {
    ElMessage.error('获取游戏统计失败');
  } finally {
    loading.value = false;
  }
};

const refreshAllData = async () => {
  loading.value = true;
  try {
    await Promise.all([refreshRetentionData(), refreshGameStats()]);
    updateAnalyticsData();
    ElMessage.success('数据刷新成功');
  } catch (error) {
    ElMessage.error('数据刷新失败');
  } finally {
    loading.value = false;
  }
};

const updateAnalyticsData = () => {
  if (!gameStats.value || !retentionStats.value) return;

  const stats = gameStats.value;
  const retention = retentionStats.value;

  analyticsData.value = [
    {
      metric: '总用户数',
      value: formatNumber(stats.totalUsers),
      description: '注册的所有用户（包括游客）',
      trend: 'up'
    },
    {
      metric: '活跃用户数',
      value: formatNumber(stats.activeUsers),
      description: '当前活跃的用户数量',
      trend: 'stable'
    },
    {
      metric: '注册用户占比',
      value: `${calculatePercentage(stats.registeredUsers, stats.totalUsers)}%`,
      description: '非游客用户在总用户中的占比',
      trend: 'up'
    },
    {
      metric: '今日新增用户',
      value: formatNumber(stats.todayNewUsers),
      description: '今日新注册的用户数量',
      trend: 'up'
    },
    {
      metric: '总游戏次数',
      value: formatNumber(stats.totalGames),
      description: '所有用户累计游戏次数',
      trend: 'up'
    },
    {
      metric: '平均游戏时长',
      value: `${stats.avgGameDuration.toFixed(1)}分钟`,
      description: '单次游戏的平均时长',
      trend: 'stable'
    },
    {
      metric: '次日留存率',
      value: formatPercentage(retention.day1Retention),
      description: '用户注册后第二天的留存比例',
      trend: 'down'
    },
    {
      metric: '7日留存率',
      value: formatPercentage(retention.day7Retention),
      description: '用户注册后第7天的留存比例',
      trend: 'stable'
    },
  ];
};

const exportData = () => {
  // 模拟导出功能
  ElMessage.success('数据导出功能开发中...');
};

onMounted(() => {
  refreshAllData();
});
</script>

<style scoped>
.analytics {
  padding: 0;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #333;
}

.page-header p {
  margin: 0;
  color: #666;
}

.overview-cards {
  margin-bottom: 24px;
}

.overview-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.overview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.card-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.metric-icon {
  font-size: 32px;
}

.metric-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.metric-desc {
  font-size: 14px;
  color: #666;
}

.detail-charts {
  margin-bottom: 24px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.retention-chart,
.user-distribution {
  min-height: 300px;
}

.retention-bars {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px 0;
}

.retention-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.retention-label {
  width: 80px;
  font-weight: 500;
  color: #333;
}

.retention-bar {
  flex: 1;
  height: 20px;
  background: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}

.retention-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.3s;
}

.retention-fill.day1 { background: linear-gradient(90deg, #4facfe, #00f2fe); }
.retention-fill.day3 { background: linear-gradient(90deg, #43e97b, #38f9d7); }
.retention-fill.day7 { background: linear-gradient(90deg, #fa709a, #fee140); }
.retention-fill.day30 { background: linear-gradient(90deg, #667eea, #764ba2); }

.retention-value {
  width: 60px;
  text-align: right;
  font-weight: bold;
  color: #1890ff;
}

.distribution-chart {
  padding: 20px;
}

.pie-container {
  display: flex;
  justify-content: space-around;
  margin-bottom: 30px;
}

.pie-item {
  text-align: center;
  padding: 20px;
  border-radius: 12px;
  background: #f8f9fa;
}

.pie-item.registered {
  border: 2px solid #1890ff;
}

.pie-item.guest {
  border: 2px solid #faad14;
}

.pie-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.pie-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.pie-percentage {
  font-size: 14px;
  font-weight: bold;
  color: #1890ff;
}

.distribution-summary {
  display: flex;
  justify-content: space-around;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.summary-label {
  font-size: 14px;
  color: #666;
}

.summary-value {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.data-table {
  margin-bottom: 24px;
}

.metric-value {
  font-weight: bold;
  color: #1890ff;
}

.loading-skeleton {
  padding: 20px;
}

:deep(.el-card__body) {
  padding: 20px;
}
</style>