'use strict';

const db = uniCloud.database();

/**
 * 最新位置信息云函数
 * 功能：返回所有机器人的最新位置信息数组
 */
exports.main = async (event, context) => {
	try {
		const latestCollection = db.collection('latest');
		const latestResult = await latestCollection
			.field({
				robotId: true,
				lat: true,
				lng: true,
				lastSeenAt: true
			})
			.get();
		
		// 转换为位置信息数组
		const positions = latestResult.data.map(item => ({
			robotId: item.robotId,
			lat: item.lat || 0,
			lng: item.lng || 0,
			timestamp: item.lastSeenAt ? item.lastSeenAt.toISOString() : new Date().toISOString()
		}));
		
		return {
			ok: true,
			data: positions
		};
	} catch (error) {
		console.error('positions-latest error:', error);
		return {
			ok: false,
			error: {
				code: 'INTERNAL_ERROR',
				message: error.message || '获取最新位置失败'
			}
		};
	}
};
