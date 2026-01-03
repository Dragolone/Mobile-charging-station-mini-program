# Mobile Charging Station Mini Program

**Robot Charging Station Monitoring System** | 机器人移动充电桩监控系统

A ToB WeChat Mini Program for monitoring mobile charging robots. Currently in MVP phase with offline mock mode.

面向 ToB 场景的微信小程序，用于监控机器人移动充电桩。当前处于 MVP 阶段，支持离线 mock 模式。

---

## Project Overview | 项目概述

This mini program monitors mobile charging robots that report telemetry data (battery, location, status) via 4G/5G networks. Designed for up to 100 robots in the current phase.

本小程序用于监控通过 4G/5G 上报遥测数据（电量、位置、状态）的移动充电机器人。当前阶段设计容量 ≤ 100 台。

---

## Tech Stack | 技术栈

- **Frontend**: uni-app + Vue3 + TypeScript
- **Platform**: WeChat Mini Program
- **IDE**: HBuilderX
- **Backend**: uniCloud (planned, currently in mock phase)
- **Architecture**: Mock → uniCloud seamless switch

---

## Current Status | 当前完成度

### Completed Features | 已完成功能

- ✅ Robot list page with 2-second polling | 机器人列表页（2秒轮询）
- ✅ Robot detail page (latest status + history) | 机器人详情页（最新态 + 历史记录）
- ✅ Complete mock data simulation | Mock 数据完整模拟真实运行
- ✅ ToB-style UI optimization | UI ToB 风格基础美化
- ✅ Decoupled API layer with `useMock` switch | API 层解耦，useMock 作为唯一切换点
- ✅ Cloud function structure planned (not deployed) | 云函数代码结构已规划（未部署）

### Mock Data | Mock 数据

Mock data simulates real robot behavior:
- Battery percentage changes (charging/discharging)
- Position updates (small movements)
- Status transitions (online/offline/charging/maintenance)
- History records (50 entries per robot, 5-second sampling)

Mock 数据模拟真实机器人行为：
- 电量变化（充电/耗电）
- 位置更新（小幅移动）
- 状态转换（在线/离线/充电中/维护中）
- 历史记录（每机器人50条，5秒采样）

---

## Project Structure | 项目结构

```
├── pages/              # 页面文件
│   ├── robots/
│   │   ├── list.vue    # 机器人列表页
│   │   └── detail.vue  # 机器人详情页
│   └── index/          # 首页
│
├── api/                # API 接口层
│   ├── robots.ts       # 机器人相关 API（统一封装）
│   ├── config.ts       # 全局配置（useMock 开关）
│   └── mock/           # Mock 数据
│       └── robots.mock.ts
│
├── uniCloud/           # 云函数（已规划，未部署）
│   └── cloudfunctions/
│       ├── telemetry-report/   # 遥测上报
│       ├── robots-list/        # 机器人列表
│       ├── robot-detail/       # 机器人详情
│       └── positions-latest/   # 最新位置
│
├── utils/              # 工具函数
│   └── format.ts       # 格式化工具（电量、时间、经纬度）
│
└── static/             # 静态资源
```

---

## Getting Started | 快速开始

### Prerequisites | 前置要求

- HBuilderX (latest version)
- WeChat Developer Tools
- Node.js (for TypeScript compilation)

### Development Setup | 开发环境

1. Open project in HBuilderX
2. Run → Run to Mini Program → WeChat Developer Tools
3. The project runs in mock mode by default (`useMock = true`)
4. No cloud service required for full functionality

**Configuration | 配置**

Mock mode is controlled in `api/config.ts`:

```typescript
export const useMock = true;  // true: mock mode, false: cloud mode
```

---

## Mock ↔ Cloud Switch | Mock 与云切换

### Architecture | 架构说明

The API layer (`api/robots.ts`) provides a unified interface that switches between mock and cloud functions based on `useMock`:

API 层提供统一接口，根据 `useMock` 自动切换 mock 与云函数：

```typescript
// api/robots.ts
if (useMock) {
  return mockRobotsList(options);  // Mock mode
} else {
  return await uniCloud.callFunction({...});  // Cloud mode
}
```

### Data Structure Consistency | 数据结构一致性

Mock functions return the same structure as cloud functions:
- Response format: `{ ok: boolean, data?: any, error?: {code, message} }`
- Field names: `robotId`, `batteryPct`, `lat`, `lng`, `state`, `lastSeenAt`
- No page code changes required when switching

Mock 函数返回结构与云函数完全一致：
- 响应格式：`{ ok: boolean, data?: any, error?: {code, message} }`
- 字段命名：`robotId`, `batteryPct`, `lat`, `lng`, `state`, `lastSeenAt`
- 切换时无需修改页面代码

### Switching to Cloud | 切换到云模式

1. Enable uniCloud service space in HBuilderX
2. Create database collections: `robots`, `latest`, `history`
3. Deploy cloud functions
4. Set `useMock = false` in `api/config.ts`
5. Test and verify

---

## Roadmap | 后续计划

### Phase 1: Cloud Deployment | 云服务部署
- [ ] Enable uniCloud service space | 启用 uniCloud 服务空间
- [ ] Create database collections | 创建数据库集合
- [ ] Deploy cloud functions | 部署云函数
- [ ] Switch from mock to cloud | Mock → 真云切换

### Phase 2: Features | 功能扩展
- [ ] Map page (robot locations) | 地图页（机器人位置）
- [ ] Alert system (low battery / offline) | 告警能力（低电 / 离线）
- [ ] Data statistics dashboard | 数据统计看板

---

## API Reference | API 说明

### Robot List | 机器人列表

```typescript
robotsList(options?: {
  battery_lte?: number;    // Filter by max battery
  status?: 'online' | 'offline';
}): Promise<ApiResponse<RobotInfo[]>>
```

### Robot Detail | 机器人详情

```typescript
robotDetail(robotId: string): Promise<ApiResponse<RobotDetail>>
// Returns: robot base info + latest status + 50 history records
```

### Latest Positions | 最新位置

```typescript
positionsLatest(): Promise<ApiResponse<PositionInfo[]>>
```

---

## Notes | 注意事项

- Current phase: MVP with mock data | 当前阶段：MVP，使用 mock 数据
- Cloud functions are ready but not deployed | 云函数代码已就绪但未部署
- All data structures are aligned for seamless switch | 数据结构已对齐，支持无缝切换
- UI optimized for ToB dashboard style | UI 已做 ToB 仪表盘风格优化

---

## License | 许可证

Internal use only | 内部使用

