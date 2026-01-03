'use strict';

const db = uniCloud.database();
const dbCmd = db.command;

/**
 * 遥测数据上报云函数
 * 功能：
 * 1. 写入 history 集合（采样策略：每robot至少5秒写一条）
 * 2. 更新 latest 集合（upsert）
 */
exports.main = async (event, context) => {
	try {
		const { robotId, batteryPct, lat, lng, state, speed, temperature, voltage } = event;
		
		// 参数验证
		if (!robotId) {
			return {
				ok: false,
				error: {
					code: 'MISSING_PARAM',
					message: '缺少 robotId 参数'
				}
			};
		}
		
		const now = new Date();
		const lastSeenAt = now;
		
		// 1. 检查是否需要写入 history（采样策略：每robot至少5秒写一条）
		const historyCollection = db.collection('history');
		const latestHistory = await historyCollection
			.where({
				robotId: robotId
			})
			.orderBy('ts', 'desc')
			.limit(1)
			.get();
		
		let shouldWriteHistory = true;
		if (latestHistory.data.length > 0) {
			const lastTs = latestHistory.data[0].ts;
			const timeDiff = now.getTime() - lastTs.getTime();
			// 如果距离上次写入不足5秒，则不写入
			if (timeDiff < 5000) {
				shouldWriteHistory = false;
			}
		}
		
		// 2. 写入 history（如果需要）
		if (shouldWriteHistory) {
			await historyCollection.add({
				robotId: robotId,
				batteryPct: batteryPct || 0,
				lat: lat || 0,
				lng: lng || 0,
				state: state || 'offline',
				speed: speed || 0,
				temperature: temperature || 0,
				voltage: voltage || 0,
				ts: now,
				createdAt: now
			});
		}
		
		// 3. 更新 latest 集合（upsert）
		const latestCollection = db.collection('latest');
		const existingLatest = await latestCollection
			.where({
				robotId: robotId
			})
			.limit(1)
			.get();
		
		const latestData = {
			robotId: robotId,
			batteryPct: batteryPct || 0,
			lat: lat || 0,
			lng: lng || 0,
			state: state || 'offline',
			lastSeenAt: lastSeenAt,
			speed: speed || 0,
			temperature: temperature || 0,
			voltage: voltage || 0,
			updatedAt: now
		};
		
		if (existingLatest.data.length > 0) {
			// 更新现有记录
			await latestCollection
				.where({
					robotId: robotId
				})
				.update(latestData);
		} else {
			// 插入新记录
			await latestCollection.add(latestData);
		}
		
		return {
			ok: true,
			data: {
				robotId: robotId,
				historyWritten: shouldWriteHistory,
				timestamp: now
			}
		};
	} catch (error) {
		console.error('telemetry-report error:', error);
		return {
			ok: false,
			error: {
				code: 'INTERNAL_ERROR',
				message: error.message || '遥测数据上报失败'
			}
		};
	}
};
