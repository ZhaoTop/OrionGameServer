<template>
  <div class="user-list">
    <!-- 搜索和过滤区域 -->
    <el-card class="filter-card">
      <el-form :model="queryForm" inline>
        <el-form-item label="用户名">
          <el-input
            v-model="queryForm.username"
            placeholder="请输入用户名"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        
        <el-form-item label="用户类型">
          <el-select
            v-model="queryForm.isGuest"
            placeholder="选择用户类型"
            clearable
            style="width: 150px"
          >
            <el-option label="全部" :value="undefined" />
            <el-option label="注册用户" :value="false" />
            <el-option label="游客用户" :value="true" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="用户状态">
          <el-select
            v-model="queryForm.isActive"
            placeholder="选择用户状态"
            clearable
            style="width: 150px"
          >
            <el-option label="全部" :value="undefined" />
            <el-option label="已激活" :value="true" />
            <el-option label="已禁用" :value="false" />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 用户列表 -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>用户列表</span>
          <div class="header-actions">
            <el-button type="primary" @click="refreshData">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>
      
      <el-table
        :data="userList"
        v-loading="loading"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="用户ID" width="120" show-overflow-tooltip />
        
        <el-table-column prop="username" label="用户名" width="150">
          <template #default="{ row }">
            <span v-if="row.username">{{ row.username }}</span>
            <el-tag v-else type="info" size="small">游客</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="email" label="邮箱" width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.email">{{ row.email }}</span>
            <span v-else class="text-placeholder">-</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="isGuest" label="用户类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isGuest ? 'warning' : 'success'" size="small">
              {{ row.isGuest ? '游客' : '注册用户' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="isActive" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'danger'" size="small">
              {{ row.isActive ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="level" label="等级" width="80" />
        
        <el-table-column prop="gamesPlayed" label="游戏次数" width="100">
          <template #default="{ row }">
            {{ formatNumber(row.gamesPlayed) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="totalPlayTime" label="游戏时长" width="100">
          <template #default="{ row }">
            {{ formatPlayTime(row.totalPlayTime) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="lastLoginAt" label="最后登录" width="150">
          <template #default="{ row }">
            <span v-if="row.lastLoginAt">
              {{ formatDateTime(row.lastLoginAt) }}
            </span>
            <span v-else class="text-placeholder">-</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="createdAt" label="注册时间" width="150">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="viewUserDetail(row.id)"
            >
              <el-icon><View /></el-icon>
              查看
            </el-button>
            
            <el-button
              :type="row.isActive ? 'warning' : 'success'"
              size="small"
              @click="toggleUserStatus(row)"
            >
              {{ row.isActive ? '禁用' : '启用' }}
            </el-button>
            
            <el-popconfirm
              title="确定要删除这个用户吗？"
              @confirm="deleteUser(row.id)"
            >
              <template #reference>
                <el-button type="danger" size="small">
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="queryForm.page"
          v-model:page-size="queryForm.limit"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { apiService } from '@/api';
import type { UserDetail, UserListQuery } from '@/types/auth';

const router = useRouter();

const loading = ref(false);
const userList = ref<UserDetail[]>([]);
const total = ref(0);

const queryForm = reactive<UserListQuery>({
  page: 1,
  limit: 20,
  username: '',
  isGuest: undefined,
  isActive: undefined,
});

const formatNumber = (num: number) => {
  return num.toLocaleString();
};

const formatPlayTime = (minutes: number) => {
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}小时${remainingMinutes}分钟`;
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN');
};

const loadUserList = async () => {
  loading.value = true;
  try {
    const response = await apiService.getUserList(queryForm);
    if (response.success) {
      userList.value = response.data.users;
      total.value = response.data.pagination.total;
    }
  } catch (error) {
    ElMessage.error('获取用户列表失败');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  queryForm.page = 1;
  loadUserList();
};

const handleReset = () => {
  Object.assign(queryForm, {
    page: 1,
    limit: 20,
    username: '',
    isGuest: undefined,
    isActive: undefined,
  });
  loadUserList();
};

const handleSizeChange = (val: number) => {
  queryForm.limit = val;
  queryForm.page = 1;
  loadUserList();
};

const handleCurrentChange = (val: number) => {
  queryForm.page = val;
  loadUserList();
};

const refreshData = () => {
  loadUserList();
};

const viewUserDetail = (userId: string) => {
  router.push(`/users/${userId}`);
};

const toggleUserStatus = async (user: UserDetail) => {
  const action = user.isActive ? '禁用' : '启用';
  try {
    await ElMessageBox.confirm(`确定要${action}用户 ${user.username || user.id} 吗？`, '确认操作', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    const response = await apiService.updateUserStatus(user.id, !user.isActive);
    if (response.success) {
      ElMessage.success(`${action}成功`);
      loadUserList();
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(`${action}失败`);
    }
  }
};

const deleteUser = async (userId: string) => {
  try {
    const response = await apiService.deleteUser(userId);
    if (response.success) {
      ElMessage.success('删除成功');
      loadUserList();
    }
  } catch (error) {
    ElMessage.error('删除失败');
  }
};

onMounted(() => {
  loadUserList();
});
</script>

<style scoped>
.user-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.filter-card {
  flex-shrink: 0;
}

.table-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.text-placeholder {
  color: #c0c4cc;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-table) {
  flex: 1;
}

:deep(.el-card__body) {
  padding: 20px;
}
</style>