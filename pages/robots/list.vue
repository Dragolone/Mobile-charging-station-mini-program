<template>
	<view class="container">
		<view class="header">
			<text class="title">充电机器人列表</text>
			<text class="update-time">最后更新: {{ formatTimeAgo(lastUpdateTime) }}</text>
		</view>
		
		<view class="robot-list">
			<view 
				v-for="robot in robots" 
				:key="robot.robotId"
				class="robot-item"
				@click="goToDetail(robot.robotId)"
			>
				<view class="robot-header">
					<text class="robot-name">{{ robot.name }}</text>
					<view class="status-badge" :class="'status-' + robot.state">
						<text>{{ getStatusText(robot.state) }}</text>
					</view>
				</view>
				
				<view class="robot-info">
					<view class="info-item">
						<text class="label">电量</text>
						<text class="value">{{ formatBattery(robot.batteryPct) }}%</text>
						<view class="battery-bar">
							<view 
								class="battery-fill" 
								:style="{ width: robot.batteryPct + '%', backgroundColor: getBatteryColor(robot.batteryPct) }"
							></view>
						</view>
					</view>
					
					<view class="info-item" v-if="robot.lat && robot.lng">
						<text class="label">位置</text>
						<text class="value">{{ robot.lat.toFixed(4) }}, {{ robot.lng.toFixed(4) }}</text>
					</view>
					
					<view class="info-item" v-if="robot.lastSeenAt">
						<text class="label">最后上报</text>
						<text class="value">{{ formatTimeAgo(robot.lastSeenAt) }}</text>
					</view>
				</view>
			</view>
		</view>
		
		<view v-if="robots.length === 0" class="empty">
			<text>暂无机器人数据</text>
		</view>
		
		<view v-if="loading" class="loading">
			<text>加载中...</text>
		</view>
	</view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { robotsList, type RobotInfo } from '@/api/robots';

const robots = ref<RobotInfo[]>([]);
const loading = ref(false);
const lastUpdateTime = ref<string>('');
let pollTimer: number | null = null;

// 格式化电量（1位小数）
const formatBattery = (batteryPct: number): string => {
	return batteryPct.toFixed(1);
};

// 格式化时间（xx 秒前 / xx 分钟前）
const formatTimeAgo = (time: string | Date | null): string => {
	if (!time) return '--';
	
	const now = Date.now();
	const timeValue = typeof time === 'string' ? new Date(time).getTime() : time.getTime();
	const diff = Math.floor((now - timeValue) / 1000); // 秒数差
	
	if (diff < 0) return '刚刚';
	if (diff < 60) return `${diff}秒前`;
	if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
	if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
	return `${Math.floor(diff / 86400)}天前`;
};

// 获取状态文本
const getStatusText = (state: RobotInfo['state']) => {
	const map = {
		online: '在线',
		offline: '离线',
		charging: '充电中',
		maintenance: '维护中'
	};
	return map[state] || state;
};

// 获取电池颜色（>50% 绿，20~50% 黄，<20% 红）
const getBatteryColor = (battery: number) => {
	if (battery > 50) return '#52c41a'; // 绿色
	if (battery >= 20) return '#faad14'; // 黄色
	return '#ff4d4f'; // 红色
};

// 加载机器人列表
const loadRobots = async () => {
	loading.value = true;
	try {
		const res = await robotsList();
		if (res.ok && res.data) {
			robots.value = res.data;
			lastUpdateTime.value = new Date().toISOString();
		} else {
			uni.showToast({
				title: res.error?.message || '加载失败',
				icon: 'none'
			});
		}
	} catch (error: any) {
		uni.showToast({
			title: error.message || '网络错误',
			icon: 'none'
		});
	} finally {
		loading.value = false;
	}
};

// 跳转到详情页
const goToDetail = (robotId: string) => {
	uni.navigateTo({
		url: `/pages/robots/detail?robotId=${robotId}`
	});
};

// 开始轮询
const startPolling = () => {
	// 立即加载一次
	loadRobots();
	
	// 每2秒轮询一次
	pollTimer = setInterval(() => {
		loadRobots();
	}, 2000) as unknown as number;
};

// 停止轮询
const stopPolling = () => {
	if (pollTimer !== null) {
		clearInterval(pollTimer);
		pollTimer = null;
	}
};

onMounted(() => {
	startPolling();
});

onUnmounted(() => {
	stopPolling();
});
</script>

<style scoped>
.container {
	padding: 24rpx;
	background: linear-gradient(180deg, #f0f2f5 0%, #fafafa 100%);
	min-height: 100vh;
}

.header {
	background: #ffffff;
	padding: 32rpx 28rpx;
	border-radius: 12rpx;
	margin-bottom: 24rpx;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
	border: 1rpx solid #e8e8e8;
}

.title {
	font-size: 38rpx;
	font-weight: 600;
	color: #1a1a1a;
	display: block;
	margin-bottom: 12rpx;
	letter-spacing: 0.5rpx;
}

.update-time {
	font-size: 24rpx;
	color: #8c8c8c;
}

.robot-list {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.robot-item {
	background: #ffffff;
	padding: 28rpx 24rpx;
	border-radius: 12rpx;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
	border: 1rpx solid #e8e8e8;
	transition: all 0.2s ease;
}

.robot-item:active {
	transform: scale(0.98);
	box-shadow: 0 1rpx 6rpx rgba(0, 0, 0, 0.08);
}

.robot-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24rpx;
	padding-bottom: 20rpx;
	border-bottom: 1rpx solid #f0f0f0;
}

.robot-name {
	font-size: 32rpx;
	font-weight: 600;
	color: #1a1a1a;
	letter-spacing: 0.3rpx;
}

.status-badge {
	padding: 6rpx 14rpx;
	border-radius: 16rpx;
	font-size: 22rpx;
	font-weight: 500;
	letter-spacing: 0.2rpx;
}

.status-online {
	background-color: #e6f7ff;
	color: #1890ff;
	border: 1rpx solid #91d5ff;
}

.status-offline {
	background-color: #f5f5f5;
	color: #8c8c8c;
	border: 1rpx solid #d9d9d9;
}

.status-charging {
	background-color: #fff7e6;
	color: #fa8c16;
	border: 1rpx solid #ffd591;
}

.status-maintenance {
	background-color: #fff1f0;
	color: #ff4d4f;
	border: 1rpx solid #ffccc7;
}

.robot-info {
	display: flex;
	flex-direction: column;
	gap: 18rpx;
}

.info-item {
	display: flex;
	align-items: center;
	gap: 16rpx;
}

.label {
	font-size: 26rpx;
	color: #595959;
	min-width: 120rpx;
	font-weight: 500;
}

.value {
	font-size: 26rpx;
	color: #1a1a1a;
	flex: 1;
	font-weight: 400;
}

.battery-bar {
	width: 180rpx;
	height: 10rpx;
	background-color: #f0f0f0;
	border-radius: 5rpx;
	overflow: hidden;
	margin-left: auto;
}

.battery-fill {
	height: 100%;
	border-radius: 5rpx;
	transition: all 0.3s ease;
}

.empty {
	text-align: center;
	padding: 120rpx 0;
	color: #8c8c8c;
	font-size: 28rpx;
}

.loading {
	text-align: center;
	padding: 60rpx 0;
	color: #8c8c8c;
	font-size: 28rpx;
}
</style>
