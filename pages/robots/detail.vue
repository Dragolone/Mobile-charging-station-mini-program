<template>
	<view class="container">
		<view v-if="robot" class="detail-content">
			<view class="header">
				<text class="title">{{ robot.name }}</text>
				<view class="status-badge" :class="'status-' + robot.state">
					<text>{{ getStatusText(robot.state) }}</text>
				</view>
			</view>
			
			<view class="section">
				<view class="section-title">基本信息</view>
				<view class="info-grid">
					<view class="info-item">
						<text class="label">设备ID</text>
						<text class="value">{{ robot.robotId }}</text>
					</view>
					<view class="info-item" v-if="robot.model">
						<text class="label">型号</text>
						<text class="value">{{ robot.model }}</text>
					</view>
					<view class="info-item" v-if="robot.serialNumber">
						<text class="label">序列号</text>
						<text class="value">{{ robot.serialNumber }}</text>
					</view>
					<view class="info-item" v-if="robot.location">
						<text class="label">位置</text>
						<text class="value">{{ robot.location }}</text>
					</view>
				</view>
			</view>
			
			<view class="section">
				<view class="section-title">电量状态</view>
				<view class="battery-section">
					<view class="battery-display">
						<text class="battery-value">{{ formatBattery(robot.batteryPct) }}%</text>
						<view class="battery-bar-large">
							<view 
								class="battery-fill-large" 
								:style="{ width: robot.batteryPct + '%', backgroundColor: getBatteryColor(robot.batteryPct) }"
							></view>
						</view>
					</view>
				</view>
			</view>
			
			<view class="section" v-if="robot.lat && robot.lng">
				<view class="section-title">位置信息</view>
				<view class="position-info">
					<view class="position-item">
						<text class="label">纬度:</text>
						<text class="value">{{ formatLatLng(robot.lat) }}</text>
					</view>
					<view class="position-item">
						<text class="label">经度:</text>
						<text class="value">{{ formatLatLng(robot.lng) }}</text>
					</view>
				</view>
			</view>
			
			<view class="section" v-if="robot.speed !== undefined || robot.temperature !== undefined || robot.voltage !== undefined">
				<view class="section-title">遥测数据</view>
				<view class="telemetry-grid">
					<view class="telemetry-item" v-if="robot.speed !== undefined">
						<text class="label">速度</text>
						<text class="value">{{ robot.speed.toFixed(2) }} m/s</text>
					</view>
					<view class="telemetry-item" v-if="robot.temperature !== undefined">
						<text class="label">温度</text>
						<text class="value">{{ robot.temperature.toFixed(1) }} °C</text>
					</view>
					<view class="telemetry-item" v-if="robot.voltage !== undefined">
						<text class="label">电压</text>
						<text class="value">{{ robot.voltage.toFixed(2) }} V</text>
					</view>
				</view>
			</view>
			
			<view class="section" v-if="robot.history && robot.history.length > 0">
				<view class="section-title">历史记录（最近{{ robot.history.length }}条）</view>
				<view class="history-list">
					<view 
						v-for="(item, index) in robot.history.slice(0, 10)" 
						:key="index"
						class="history-item"
					>
						<text class="history-time">{{ formatHistoryTime(item.ts) }}</text>
						<text class="history-battery">{{ formatBattery(item.batteryPct) }}%</text>
						<text class="history-state">{{ getStatusText(item.state) }}</text>
					</view>
				</view>
			</view>
			
			<view class="update-info">
				<text class="update-text">最后更新: {{ formatTimeAgo(lastUpdateTime) }}</text>
			</view>
		</view>
		
		<view v-if="loading" class="loading">
			<text>加载中...</text>
		</view>
		
		<view v-if="error" class="error">
			<text>{{ error }}</text>
		</view>
	</view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { robotDetail, type RobotDetail } from '@/api/robots';
import { formatBattery, formatLatLng, formatHistoryTime, formatTimeAgo } from '@/utils/format';

const robot = ref<RobotDetail | null>(null);
const loading = ref(false);
const error = ref('');
const lastUpdateTime = ref('');
const robotId = ref('');
let pollTimer: number | null = null;

// 获取状态文本
const getStatusText = (state: RobotDetail['state'] | string) => {
	const map: Record<string, string> = {
		online: '在线',
		offline: '离线',
		charging: '充电中',
		maintenance: '维护中'
	};
	return map[state] || state;
};

// 获取电池颜色
const getBatteryColor = (battery: number) => {
	if (battery > 50) return '#52c41a'; // 绿色
	if (battery >= 20) return '#faad14'; // 黄色
	return '#ff4d4f'; // 红色
};

// 加载机器人详情
const loadRobotDetail = async () => {
	if (!robotId.value) return;
	
	loading.value = true;
	error.value = '';
	
	try {
		const res = await robotDetail(robotId.value);
		if (res.ok && res.data) {
			robot.value = res.data;
			lastUpdateTime.value = new Date().toISOString();
		} else {
			error.value = res.error?.message || '加载失败';
			uni.showToast({
				title: error.value,
				icon: 'none'
			});
		}
	} catch (err: any) {
		error.value = err.message || '网络错误';
		uni.showToast({
			title: error.value,
			icon: 'none'
		});
	} finally {
		loading.value = false;
	}
};

// 开始轮询
const startPolling = () => {
	// 立即加载一次
	loadRobotDetail();
	
	// 每2秒轮询一次
	pollTimer = setInterval(() => {
		loadRobotDetail();
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
	// 获取路由参数
	const pages = getCurrentPages();
	const currentPage = pages[pages.length - 1];
	const options = currentPage.options || {};
	robotId.value = options.robotId || '';
	
	if (!robotId.value) {
		error.value = '缺少机器人ID';
		return;
	}
	
	startPolling();
});

onUnmounted(() => {
	stopPolling();
});
</script>

<style scoped>
.container {
	padding: 20rpx;
	background-color: #f5f5f5;
	min-height: 100vh;
}

.detail-content {
	background-color: #fff;
	border-radius: 10rpx;
	padding: 30rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 40rpx;
	padding-bottom: 30rpx;
	border-bottom: 2rpx solid #f0f0f0;
}

.title {
	font-size: 40rpx;
	font-weight: bold;
	color: #333;
}

.status-badge {
	padding: 10rpx 20rpx;
	border-radius: 20rpx;
	font-size: 24rpx;
}

.status-online {
	background-color: #e6f7ff;
	color: #1890ff;
}

.status-offline {
	background-color: #f5f5f5;
	color: #999;
}

.status-charging {
	background-color: #fff7e6;
	color: #fa8c16;
}

.status-maintenance {
	background-color: #fff1f0;
	color: #ff4d4f;
}

.section {
	margin-bottom: 40rpx;
}

.section-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 20rpx;
	padding-bottom: 10rpx;
	border-bottom: 1rpx solid #f0f0f0;
}

.info-grid {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.info-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 15rpx;
	background-color: #fafafa;
	border-radius: 8rpx;
}

.info-item .label {
	font-size: 28rpx;
	color: #666;
}

.info-item .value {
	font-size: 28rpx;
	color: #333;
	font-weight: 500;
}

.battery-section {
	padding: 20rpx 0;
}

.battery-display {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 20rpx;
}

.battery-value {
	font-size: 48rpx;
	font-weight: bold;
	color: #333;
}

.battery-bar-large {
	width: 100%;
	height: 20rpx;
	background-color: #f0f0f0;
	border-radius: 10rpx;
	overflow: hidden;
}

.battery-fill-large {
	height: 100%;
	border-radius: 10rpx;
	transition: width 0.3s ease;
}

.position-info {
	display: flex;
	flex-direction: column;
	gap: 15rpx;
}

.position-item {
	display: flex;
	align-items: center;
	padding: 15rpx;
	background-color: #fafafa;
	border-radius: 8rpx;
}

.position-item .label {
	font-size: 28rpx;
	color: #666;
	min-width: 120rpx;
}

.position-item .value {
	font-size: 28rpx;
	color: #333;
	font-family: monospace;
}

.telemetry-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 15rpx;
}

.telemetry-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 20rpx;
	background-color: #fafafa;
	border-radius: 8rpx;
}

.telemetry-item .label {
	font-size: 24rpx;
	color: #999;
	margin-bottom: 10rpx;
}

.telemetry-item .value {
	font-size: 28rpx;
	color: #333;
	font-weight: 500;
}

.history-list {
	display: flex;
	flex-direction: column;
	gap: 10rpx;
	max-height: 400rpx;
	overflow-y: auto;
}

.history-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 15rpx;
	background-color: #fafafa;
	border-radius: 8rpx;
	font-size: 24rpx;
}

.history-time {
	color: #666;
	flex: 1;
}

.history-battery {
	color: #333;
	font-weight: 500;
	margin: 0 20rpx;
}

.history-state {
	color: #999;
	font-size: 22rpx;
}

.update-info {
	margin-top: 40rpx;
	padding-top: 20rpx;
	border-top: 1rpx solid #f0f0f0;
	text-align: center;
}

.update-text {
	font-size: 24rpx;
	color: #999;
}

.loading {
	text-align: center;
	padding: 100rpx 0;
	color: #999;
	font-size: 28rpx;
}

.error {
	text-align: center;
	padding: 100rpx 0;
	color: #ff4d4f;
	font-size: 28rpx;
}
</style>
