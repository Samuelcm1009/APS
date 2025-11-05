# 生产订单管理系统后端

## 概述
这个后端系统提供了完整的生产订单数据管理功能，支持Excel文件读写和RESTful API接口。

## 文件结构

### 核心文件
- `organizer_table_data.py` - 主要的数据处理类，负责Excel文件的读写和订单管理
- `api_server.py` - Flask API服务器，提供RESTful接口
- `requirements.txt` - Python依赖包列表

### 测试文件
- `test_backend.py` - 后端功能测试脚本

## 功能特性

### 1. Excel数据处理 (`organizer_table_data.py`)
- **读取Excel文件**: 从Excel文件读取生产订单数据
- **写入Excel文件**: 将订单数据写入Excel文件
- **添加订单**: 添加新的生产订单
- **更新订单**: 更新现有订单信息
- **删除订单**: 删除指定的订单
- **数据验证**: 自动验证和清理数据格式
- **JSON导入/导出**: 支持JSON格式的数据导入导出

### 2. API接口 (`api_server.py`)
提供以下RESTful API端点：

#### 健康检查
- `GET /api/health` - 检查服务状态

#### 订单管理
- `GET /api/orders` - 获取所有订单
- `POST /api/orders` - 创建新订单
- `PUT /api/orders/<id>` - 更新订单
- `DELETE /api/orders/<id>` - 删除订单

#### 数据导入导出
- `GET /api/orders/export` - 导出订单到Excel
- `POST /api/orders/import` - 从Excel导入订单
- `POST /api/orders/upload` - 上传Excel文件

## 快速开始

### 1. 安装依赖
```bash
pip install -r requirements.txt
```

### 2. 测试后端功能
```bash
python test_backend.py
```

### 3. 启动API服务器
```bash
python api_server.py
```

服务器将在 `http://localhost:5000` 启动

### 4. API使用示例

#### 获取所有订单
```bash
curl http://localhost:5000/api/orders
```

#### 创建新订单
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "Priority": 10,
    "Status": "New",
    "Production_order": "FA_401005_R2017",
    "Part_type": "4_318225",
    "Order_progress": "0%",
    "Pieces_finished": 0,
    "Pieces_intended": 30,
    "Delivery_date": "2017-12-15",
    "Scheduled_date": "2018-12-15"
  }'
```

#### 导出订单到Excel
```bash
curl http://localhost:5000/api/orders/export -o orders.xlsx
```

## 数据格式

### 订单数据结构
```json
{
  "Priority": 5,                    // 优先级 (整数)
  "Status": "Active",              // 状态 (字符串)
  "Production_order": "FA_401001_R2017",  // 生产订单号
  "Part_type": "4_318220",        // 零件类型
  "Order_progress": "80%",        // 订单进度
  "Pieces_finished": 2,            // 已完成数量
  "Pieces_intended": 50,           // 计划数量
  "Delivery_date": "2017-09-26",   // 交付日期
  "Scheduled_date": "2018-09-26"  // 计划日期
}
```

## 错误处理

API返回统一的错误格式：
```json
{
  "status": "error",
  "message": "错误描述",
  "error_code": "ERROR_CODE",
  "timestamp": "2025-11-05T10:00:00.000000"
}
```

## 日志记录

系统使用Python的logging模块记录操作日志，包括：
- 数据读写操作
- API请求处理
- 错误和异常信息

## 扩展功能

### OrganizerAPI类
预留的API接口类，包含以下方法：
- `get_orders()` - 获取订单列表
- `create_order(data)` - 创建新订单
- `update_order(order_id, data)` - 更新订单
- `delete_order(order_id)` - 删除订单
- `upload_file(file)` - 上传文件

这个类可以轻松扩展以支持更多的API功能。

## 注意事项

1. **文件路径**: Excel文件默认存储在 `data/` 目录下
2. **数据备份**: 建议定期备份Excel文件
3. **并发访问**: 当前版本不支持并发写入，需要添加文件锁机制
4. **数据验证**: 所有输入数据都会进行格式验证和清理

## 下一步计划

1. 添加数据库支持（SQLite/PostgreSQL）
2. 实现用户认证和授权
3. 添加数据缓存机制
4. 支持批量操作
5. 添加数据备份和恢复功能