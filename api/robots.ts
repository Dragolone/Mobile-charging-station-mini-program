/**
 * 机器人相关 API 接口
 * 统一封装云函数调用，支持离线 mock 模式
 */

import { useMock } from './config';
import { mockRobotsList, mockRobotDetail, mockPositionsLatest } from './mock/robots.mock';

// 统一响应结构
export interface ApiResponse<T = any> {
	ok: boolean;
	data?: T;
	error?: {
		code: string;
		message: string;
	};
}

// 机器人基础信息（对应 robots 集合）
export interface RobotBase {
	_id?: string;
	robotId: string;
	name: string;
	model?: string;
	serialNumber?: string;
	location?: string;
	createdAt?: Date | string;
	updatedAt?: Date | string;
}

// 最新状态（对应 latest 集合）
export interface RobotLatest {
	_id?: string;
	robotId: string;
	batteryPct: number; // 0-100
	lat: number;
	lng: number;
	state: 'online' | 'offline' | 'charging' | 'maintenance';
	lastSeenAt: Date | string | null;
	speed?: number;
	temperature?: number;
	voltage?: number;
	updatedAt?: Date | string;
}

// 历史记录（对应 history 集合）
export interface RobotHistory {
	_id?: string;
	robotId: string;
	batteryPct: number;
	lat: number;
	lng: number;
	state: string;
	speed?: number;
	temperature?: number;
	voltage?: number;
	ts: Date | string;
	createdAt?: Date | string;
}

// 机器人列表项（robots + latest 合并）
export interface RobotInfo extends RobotBase, RobotLatest {}

// 机器人详情（robots + latest + history）
export interface RobotDetail extends RobotBase, RobotLatest {
	history: RobotHistory[];
}

// 位置信息
export interface PositionInfo {
	robotId: string;
	lat: number;
	lng: number;
	timestamp: string;
}

/**
 * 获取机器人列表
 * @param options 过滤选项
 * @param options.battery_lte 电量小于等于
 * @param options.status 状态过滤：'online' | 'offline'
 */
export async function robotsList(options?: {
	battery_lte?: number;
	status?: 'online' | 'offline';
}): Promise<ApiResponse<RobotInfo[]>> {
	if (useMock) {
		// 离线模式：使用 mock 数据
		return mockRobotsList(options);
	} else {
		// 在线模式：调用真实云函数
		try {
			// @ts-ignore uniCloud 是 uni-app 的全局对象
			const res = await uniCloud.callFunction({
				name: 'robots-list',
				data: options || {}
			});
			return res.result as ApiResponse<RobotInfo[]>;
		} catch (error: any) {
			return {
				ok: false,
				error: {
					code: 'CLOUD_FUNCTION_ERROR',
					message: error.message || '云函数调用失败'
				}
			};
		}
	}
}

/**
 * 获取机器人详情
 */
export async function robotDetail(robotId: string): Promise<ApiResponse<RobotDetail>> {
	if (useMock) {
		// 离线模式：使用 mock 数据
		return mockRobotDetail(robotId);
	} else {
		// 在线模式：调用真实云函数
		try {
			// @ts-ignore uniCloud 是 uni-app 的全局对象
			const res = await uniCloud.callFunction({
				name: 'robot-detail',
				data: { robotId }
			});
			return res.result as ApiResponse<RobotDetail>;
		} catch (error: any) {
			return {
				ok: false,
				error: {
					code: 'CLOUD_FUNCTION_ERROR',
					message: error.message || '云函数调用失败'
				}
			};
		}
	}
}

/**
 * 获取所有机器人的最新位置
 */
export async function positionsLatest(): Promise<ApiResponse<PositionInfo[]>> {
	if (useMock) {
		// 离线模式：使用 mock 数据
		return mockPositionsLatest();
	} else {
		// 在线模式：调用真实云函数
		try {
			// @ts-ignore uniCloud 是 uni-app 的全局对象
			const res = await uniCloud.callFunction({
				name: 'positions-latest',
				data: {}
			});
			return res.result as ApiResponse<PositionInfo[]>;
		} catch (error: any) {
			return {
				ok: false,
				error: {
					code: 'CLOUD_FUNCTION_ERROR',
					message: error.message || '云函数调用失败'
				}
			};
		}
	}
}

/**
 * 上报遥测数据
 */
export async function telemetryReport(data: {
	robotId: string;
	batteryPct?: number;
	lat?: number;
	lng?: number;
	state?: string;
	speed?: number;
	temperature?: number;
	voltage?: number;
}): Promise<ApiResponse> {
	if (useMock) {
		// 离线模式：mock 暂不支持上报（可扩展）
		return {
			ok: true,
			data: {
				robotId: data.robotId,
				timestamp: new Date()
			}
		};
	} else {
		// 在线模式：调用真实云函数
		try {
			// @ts-ignore uniCloud 是 uni-app 的全局对象
			const res = await uniCloud.callFunction({
				name: 'telemetry-report',
				data: data
			});
			return res.result as ApiResponse;
		} catch (error: any) {
			return {
				ok: false,
				error: {
					code: 'CLOUD_FUNCTION_ERROR',
					message: error.message || '云函数调用失败'
				}
			};
		}
	}
}
