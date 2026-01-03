# 数据库集合结构定义

## robots 集合（机器人基础信息）
```javascript
{
  _id: String,           // 系统自动生成
  robotId: String,      // 机器人ID（唯一索引）
  name: String,         // 机器人名称
  model: String,        // 型号
  serialNumber: String, // 序列号
  location: String,     // 位置描述
  createdAt: Date,      // 创建时间
  updatedAt: Date       // 更新时间
}
```

## latest 集合（最新状态）
```javascript
{
  _id: String,          // 系统自动生成
  robotId: String,      // 机器人ID（唯一索引）
  batteryPct: Number,   // 电量百分比 0-100
  lat: Number,          // 纬度
  lng: Number,          // 经度
  state: String,        // 状态：'online' | 'offline' | 'charging' | 'maintenance'
  lastSeenAt: Date,     // 最后上报时间
  speed: Number,        // 速度 (m/s)
  temperature: Number,  // 温度 (°C)
  voltage: Number,      // 电压 (V)
  updatedAt: Date       // 更新时间
}
```

## history 集合（历史记录）
```javascript
{
  _id: String,          // 系统自动生成
  robotId: String,      // 机器人ID（索引）
  batteryPct: Number,   // 电量百分比
  lat: Number,          // 纬度
  lng: Number,          // 经度
  state: String,        // 状态
  speed: Number,        // 速度
  temperature: Number,  // 温度
  voltage: Number,      // 电压
  ts: Date,             // 时间戳（索引，倒序）
  createdAt: Date       // 创建时间
}
```

## 索引
- robots.robotId: 唯一索引
- latest.robotId: 唯一索引
- history.robotId: 普通索引
- history.ts: 普通索引（倒序）

