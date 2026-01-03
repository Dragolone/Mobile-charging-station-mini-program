'use strict';

const db = uniCloud.database();

/**
 * 机器人详情云函数
 * 返回：robot + latest + 最近50条history（按ts倒序）
 */
exports.main = async (event, context) => {
	try {
		const { robotId } = event;
		
		if (!robotId) {
			return {
				ok: false,
				error: {
					code: 'MISSING_PARAM',
					message: '缺少 robotId 参数'
				}
			};
		}
		
		// 1. 获取 robot 基础信息
		const robotsCollection = db.collection('robots');
		const robotResult = await robotsCollection
			.where({
				robotId: robotId
			})
			.limit(1)
			.get();
		
		if (robotResult.data.length === 0) {
			return {
				ok: false,
				error: {
					code: 'ROBOT_NOT_FOUND',
					message: `未找到机器人 ${robotId}`
				}
			};
		}
		
		const robot = robotResult.data[0];
		
		// 2. 获取 latest 最新状态
		const latestCollection = db.collection('latest');
		const latestResult = await latestCollection
			.where({
				robotId: robotId
			})
			.limit(1)
			.get();
		
		const latest = latestResult.data.length > 0 ? latestResult.data[0] : null;
		
		// 3. 获取最近50条 history（按ts倒序）
		const historyCollection = db.collection('history');
		const historyResult = await historyCollection
			.where({
				robotId: robotId
			})
			.orderBy('ts', 'desc')
			.limit(50)
			.get();
		
		const history = historyResult.data || [];
		
		// 合并数据
		const result = {
			...robot,
			batteryPct: latest?.batteryPct || 0,
			lat: latest?.lat || 0,
			lng: latest?.lng || 0,
			state: latest?.state || 'offline',
			lastSeenAt: latest?.lastSeenAt || null,
			speed: latest?.speed || 0,
			temperature: latest?.temperature || 0,
			voltage: latest?.voltage || 0,
			history: history.map(item => ({
				robotId: item.robotId,
				batteryPct: item.batteryPct,
				lat: item.lat,
				lng: item.lng,
				state: item.state,
				speed: item.speed,
				temperature: item.temperature,
				voltage: item.voltage,
				ts: item.ts,
				createdAt: item.createdAt
			}))
		};
		
		return {
			ok: true,
			data: result
		};
	} catch (error) {
		console.error('robot-detail error:', error);
		return {
			ok: false,
			error: {
				code: 'INTERNAL_ERROR',
				message: error.message || '获取机器人详情失败'
			}
		};
	}
};
