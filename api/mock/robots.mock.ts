/**
 * 机器人相关 Mock 数据
 * 离线开发时使用，模拟云函数返回
 * 支持每2秒数据变化，用于测试轮询功能
 * 数据结构与真实云函数返回完全一致
 */

import type { ApiResponse, RobotInfo, RobotDetail, PositionInfo, RobotHistory } from '../robots';

// Mock robots 基础数据（对应 robots 集合）
const mockRobotsBase = [
	{
		robotId: 'robot-001',
		name: '充电机器人 #001',
		model: 'ChargingBot Pro',
		serialNumber: 'SN-ROBOT-001',
		location: '北京市朝阳区',
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date()
	},
	{
		robotId: 'robot-002',
		name: '充电机器人 #002',
		model: 'ChargingBot Pro',
		serialNumber: 'SN-ROBOT-002',
		location: '北京市海淀区',
		createdAt: new Date('2024-01-02'),
		updatedAt: new Date()
	},
	{
		robotId: 'robot-003',
		name: '充电机器人 #003',
		model: 'ChargingBot Standard',
		serialNumber: 'SN-ROBOT-003',
		location: '北京市西城区',
		createdAt: new Date('2024-01-03'),
		updatedAt: new Date()
	},
	{
		robotId: 'robot-004',
		name: '充电机器人 #004',
		model: 'ChargingBot Pro',
		serialNumber: 'SN-ROBOT-004',
		location: '北京市东城区',
		createdAt: new Date('2024-01-04'),
		updatedAt: new Date()
	}
];

// Mock latest 数据（对应 latest 集合）
let mockLatest: Array<{
	robotId: string;
	batteryPct: number;
	lat: number;
	lng: number;
	state: 'online' | 'offline' | 'charging' | 'maintenance';
	lastSeenAt: Date;
	speed: number;
	temperature: number;
	voltage: number;
}> = [
	{
		robotId: 'robot-001',
		batteryPct: 85,
		lat: 39.9042,
		lng: 116.4074,
		state: 'online',
		lastSeenAt: new Date(),
		speed: 2.5,
		temperature: 28.5,
		voltage: 48.5
	},
	{
		robotId: 'robot-002',
		batteryPct: 45,
		lat: 39.9052,
		lng: 116.4084,
		state: 'charging',
		lastSeenAt: new Date(),
		speed: 0,
		temperature: 30.2,
		voltage: 46.8
	},
	{
		robotId: 'robot-003',
		batteryPct: 20,
		lat: 39.9032,
		lng: 116.4064,
		state: 'offline',
		lastSeenAt: new Date(Date.now() - 120000), // 2分钟前，应该是offline
		speed: 0,
		temperature: 25.0,
		voltage: 42.0
	},
	{
		robotId: 'robot-004',
		batteryPct: 92,
		lat: 39.9062,
		lng: 116.4094,
		state: 'online',
		lastSeenAt: new Date(),
		speed: 3.2,
		temperature: 27.8,
		voltage: 49.2
	}
];

// Mock history 数据（每个机器人最近50条）
const mockHistoryMap: Map<string, RobotHistory[]> = new Map();

// 用于模拟数据变化的计数器
let updateCounter = 0;

/**
 * 初始化 history 数据
 */
function initHistory() {
	mockRobotsBase.forEach(robot => {
		const history: RobotHistory[] = [];
		const now = Date.now();
		// 生成最近50条历史记录
		for (let i = 0; i < 50; i++) {
			const ts = new Date(now - i * 5000); // 每5秒一条
			const latest = mockLatest.find(l => l.robotId === robot.robotId);
			history.push({
				robotId: robot.robotId,
				batteryPct: (latest?.batteryPct || 50) + (Math.random() - 0.5) * 10,
				lat: (latest?.lat || 39.9) + (Math.random() - 0.5) * 0.001,
				lng: (latest?.lng || 116.4) + (Math.random() - 0.5) * 0.001,
				state: latest?.state || 'online',
				speed: (latest?.speed || 0) + (Math.random() - 0.5) * 1,
				temperature: (latest?.temperature || 25) + (Math.random() - 0.5) * 5,
				voltage: (latest?.voltage || 48) + (Math.random() - 0.5) * 2,
				ts: ts,
				createdAt: ts
			});
		}
		mockHistoryMap.set(robot.robotId, history);
	});
}

// 初始化
initHistory();

/**
 * 模拟数据更新（每2秒调用时数据会变化）
 */
function updateMockData() {
	updateCounter++;
	const now = new Date();
	
	// 更新 latest 数据
	mockLatest.forEach(latest => {
		if (latest.state === 'charging') {
			// 充电中：电量增加
			latest.batteryPct = Math.min(100, latest.batteryPct + Math.random() * 2);
		} else if (latest.state === 'online') {
			// 在线：电量缓慢减少
			latest.batteryPct = Math.max(0, latest.batteryPct - Math.random() * 0.5);
		}
		
		// 随机更新位置（小幅移动）
		latest.lat += (Math.random() - 0.5) * 0.0001;
		latest.lng += (Math.random() - 0.5) * 0.0001;
		
		// 更新遥测数据
		latest.speed = Math.max(0, latest.speed + (Math.random() - 0.5) * 0.5);
		latest.temperature = 25 + Math.random() * 10;
		latest.voltage = 46 + Math.random() * 4;
		
		// 更新 lastSeenAt（online/charging 状态更新为当前时间，offline 保持不变）
		if (latest.state === 'online' || latest.state === 'charging') {
			latest.lastSeenAt = now;
		}
		
		// 随机改变状态（每10次更新可能改变一次）
		if (updateCounter % 10 === 0 && Math.random() > 0.7) {
			const states: Array<'online' | 'offline' | 'charging' | 'maintenance'> = ['online', 'offline', 'charging', 'maintenance'];
			latest.state = states[Math.floor(Math.random() * states.length)];
			if (latest.state === 'online' || latest.state === 'charging') {
				latest.lastSeenAt = now;
			}
		}
	});
}

/**
 * 判断机器人是否在线（基于 lastSeenAt，60秒内为online）
 */
function isOnline(lastSeenAt: Date): boolean {
	const now = Date.now();
	const sixtySecondsAgo = now - 60 * 1000;
	return lastSeenAt.getTime() >= sixtySecondsAgo;
}

/**
 * Mock 机器人列表
 * @param params 过滤参数 { battery_lte?, status? }
 */
export function mockRobotsList(params?: {
	battery_lte?: number;
	status?: 'online' | 'offline';
}): ApiResponse<RobotInfo[]> {
	// 每次调用都更新一次数据（模拟实时变化）
	updateMockData();
	
	// 合并 robots 和 latest
	let result: RobotInfo[] = mockRobotsBase.map(robot => {
		const latest = mockLatest.find(l => l.robotId === robot.robotId);
		if (!latest) return null;
		
		return {
			...robot,
			...latest
		} as RobotInfo;
	}).filter(item => item !== null) as RobotInfo[];
	
	// 应用过滤条件
	if (params?.battery_lte !== undefined && params?.battery_lte !== null) {
		result = result.filter(r => r.batteryPct <= params.battery_lte);
	}
	
	if (params?.status === 'online') {
		result = result.filter(r => isOnline(new Date(r.lastSeenAt as string)));
	} else if (params?.status === 'offline') {
		result = result.filter(r => !isOnline(new Date(r.lastSeenAt as string)));
	}
	
	return {
		ok: true,
		data: result
	};
}

/**
 * Mock 机器人详情
 * @param robotId 机器人ID
 */
export function mockRobotDetail(robotId: string): ApiResponse<RobotDetail> {
	// 每次调用都更新一次数据（模拟实时变化）
	updateMockData();
	
	if (!robotId) {
		return {
			ok: false,
			error: {
				code: 'MISSING_PARAM',
				message: '缺少 robotId 参数'
			}
		};
	}
	
	const robot = mockRobotsBase.find(r => r.robotId === robotId);
	const latest = mockLatest.find(l => l.robotId === robotId);
	const history = mockHistoryMap.get(robotId) || [];
	
	if (!robot || !latest) {
		return {
			ok: false,
			error: {
				code: 'ROBOT_NOT_FOUND',
				message: `未找到机器人 ${robotId}`
			}
		};
	}
	
	// 合并数据
	const detail: RobotDetail = {
		...robot,
		...latest,
		history: history.slice(0, 50) // 最近50条
	};
	
	return {
		ok: true,
		data: detail
	};
}

/**
 * Mock 最新位置列表
 */
export function mockPositionsLatest(): ApiResponse<PositionInfo[]> {
	// 每次调用都更新一次数据（模拟实时变化）
	updateMockData();
	
	const positions: PositionInfo[] = mockLatest.map(latest => ({
		robotId: latest.robotId,
		lat: latest.lat,
		lng: latest.lng,
		timestamp: latest.lastSeenAt.toISOString()
	}));
	
	return {
		ok: true,
		data: positions
	};
}
