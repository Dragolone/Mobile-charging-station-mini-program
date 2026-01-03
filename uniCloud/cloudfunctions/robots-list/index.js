'use strict';

const db = uniCloud.database();
const dbCmd = db.command;

/**
 * 机器人列表云函数
 * 功能：
 * 1. 合并 robots 和 latest 集合
 * 2. 支持 battery_lte 过滤（电量小于等于）
 * 3. 支持 online/offline 过滤（基于 lastSeenAt，60秒内为online）
 */
exports.main = async (event, context) => {
	try {
		const { battery_lte, status } = event;
		
		// 获取 robots 集合数据
		const robotsCollection = db.collection('robots');
		let robotsQuery = robotsCollection;
		const robotsResult = await robotsQuery.get();
		
		if (robotsResult.data.length === 0) {
			return {
				ok: true,
				data: []
			};
		}
		
		// 获取 latest 集合数据
		const latestCollection = db.collection('latest');
		let latestQuery = latestCollection;
		
		// 构建 latest 查询条件
		const now = new Date();
		const sixtySecondsAgo = new Date(now.getTime() - 60 * 1000);
		
		// 如果指定了 status 过滤
		if (status === 'online') {
			// online: lastSeenAt 在60秒内
			latestQuery = latestQuery.where({
				lastSeenAt: dbCmd.gte(sixtySecondsAgo)
			});
		} else if (status === 'offline') {
			// offline: lastSeenAt 在60秒前或不存在
			latestQuery = latestQuery.where(
				dbCmd.or([
					{ lastSeenAt: dbCmd.lt(sixtySecondsAgo) },
					{ lastSeenAt: dbCmd.exists(false) }
				])
			);
		}
		
		// 如果指定了 battery_lte 过滤
		if (battery_lte !== undefined && battery_lte !== null) {
			latestQuery = latestQuery.where({
				batteryPct: dbCmd.lte(battery_lte)
			});
		}
		
		const latestResult = await latestQuery.get();
		
		// 创建 latest 数据的 Map，以 robotId 为 key
		const latestMap = new Map();
		latestResult.data.forEach(item => {
			latestMap.set(item.robotId, item);
		});
		
		// 合并数据
		const result = robotsResult.data
			.map(robot => {
				const latest = latestMap.get(robot.robotId);
				
				// 如果指定了 status 过滤，需要检查是否匹配
				if (status) {
					const lastSeenAt = latest?.lastSeenAt;
					const isOnline = lastSeenAt && new Date(lastSeenAt).getTime() >= sixtySecondsAgo.getTime();
					
					if (status === 'online' && !isOnline) {
						return null; // 不匹配，过滤掉
					}
					if (status === 'offline' && isOnline) {
						return null; // 不匹配，过滤掉
					}
				}
				
				// 如果指定了 battery_lte 过滤，需要检查
				if (battery_lte !== undefined && battery_lte !== null) {
					const batteryPct = latest?.batteryPct || 0;
					if (batteryPct > battery_lte) {
						return null; // 不匹配，过滤掉
					}
				}
				
				// 合并数据
				return {
					...robot,
					batteryPct: latest?.batteryPct || 0,
					lat: latest?.lat || 0,
					lng: latest?.lng || 0,
					state: latest?.state || 'offline',
					lastSeenAt: latest?.lastSeenAt || null,
					speed: latest?.speed || 0,
					temperature: latest?.temperature || 0,
					voltage: latest?.voltage || 0
				};
			})
			.filter(item => item !== null); // 过滤掉 null
		
		return {
			ok: true,
			data: result
		};
	} catch (error) {
		console.error('robots-list error:', error);
		return {
			ok: false,
			error: {
				code: 'INTERNAL_ERROR',
				message: error.message || '获取机器人列表失败'
			}
		};
	}
};
