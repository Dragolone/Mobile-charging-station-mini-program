/**
 * 格式化工具函数
 * 用于统一格式化展示数据，不影响原始数据
 */

/**
 * 格式化电量百分比（1位小数）
 */
export function formatBattery(batteryPct: number): string {
	return batteryPct.toFixed(1);
}

/**
 * 格式化经纬度（4位小数）
 */
export function formatLatLng(value: number): string {
	return value.toFixed(4);
}

/**
 * 格式化历史记录时间（相对时间或 HH:mm:ss）
 * @param time 时间戳或日期字符串
 */
export function formatHistoryTime(time: Date | string): string {
	const now = Date.now();
	const timeValue = typeof time === 'string' ? new Date(time).getTime() : time.getTime();
	const diff = Math.floor((now - timeValue) / 1000); // 秒数差
	
	// 如果是最近1分钟内，显示相对时间
	if (diff >= 0 && diff < 60) {
		return diff === 0 ? '刚刚' : `${diff}秒前`;
	}
	
	// 如果是最近1小时内，显示相对时间
	if (diff < 3600) {
		return `${Math.floor(diff / 60)}分钟前`;
	}
	
	// 否则显示 HH:mm:ss 格式
	const date = typeof time === 'string' ? new Date(time) : time;
	const hours = date.getHours().toString().padStart(2, '0');
	const minutes = date.getMinutes().toString().padStart(2, '0');
	const seconds = date.getSeconds().toString().padStart(2, '0');
	return `${hours}:${minutes}:${seconds}`;
}

/**
 * 格式化相对时间（用于列表页等）
 */
export function formatTimeAgo(time: string | Date | null): string {
	if (!time) return '--';
	
	const now = Date.now();
	const timeValue = typeof time === 'string' ? new Date(time).getTime() : time.getTime();
	const diff = Math.floor((now - timeValue) / 1000); // 秒数差
	
	if (diff < 0) return '刚刚';
	if (diff < 60) return `${diff}秒前`;
	if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
	if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
	return `${Math.floor(diff / 86400)}天前`;
}

