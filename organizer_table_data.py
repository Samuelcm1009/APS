#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生产订单表格数据处理模块
Production Order Table Data Processing Module

功能：
1. 读取Excel文件中的生产订单数据
2. 将生产订单数据写入Excel文件
3. 提供API接口预留空间
4. 支持数据的增删改查操作
"""

import pandas as pd
import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional
import logging

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class OrganizerTableData:
    """生产订单表格数据处理类"""
    
    def __init__(self, excel_file_path: str = "data/production_orders.xlsx"):
        """
        初始化数据处理类
        
        Args:
            excel_file_path: Excel文件路径
        """
        self.excel_file_path = excel_file_path
        self.columns = [
            'Priority', 'Status', 'Production_order', 'Part_type',
            'Pieces_finished', 'Pieces_intended',
            'Delivery_date', 'Scheduled_date'
        ]
        
    def read_excel_data(self) -> List[Dict[str, Any]]:
        """
        读取Excel文件中的数据
        
        Returns:
            List[Dict]: 生产订单数据列表
        """
        try:
            if not os.path.exists(self.excel_file_path):
                logger.warning(f"文件 {self.excel_file_path} 不存在，返回空数据")
                return []
            
            # 读取Excel文件
            df = pd.read_excel(self.excel_file_path)
            
            # 数据验证和清理
            df = self._validate_and_clean_data(df)

            # 根据Priority排序并重排为连续的1..N（仅用于返回，不写回文件）
            df = self._normalize_priority_df(df)
            
            # 转换为字典列表
            data = df.to_dict('records')
            
            logger.info(f"成功读取 {len(data)} 条生产订单数据")
            return data
            
        except Exception as e:
            logger.error(f"读取Excel文件失败: {str(e)}")
            return []
    
    def write_excel_data(self, data: List[Dict[str, Any]]) -> bool:
        """
        将数据写入Excel文件
        
        Args:
            data: 生产订单数据列表
            
        Returns:
            bool: 写入是否成功
        """
        try:
            # 创建DataFrame
            df = pd.DataFrame(data)
            
            # 确保列顺序正确
            df = df.reindex(columns=self.columns, fill_value='')

            # 写入前进行数据验证与清理，避免NaN等非法JSON值
            df = self._validate_and_clean_data(df)
            
            # 写入前归一化：按Priority排序并将Priority重排为1..N
            df = self._normalize_priority_df(df)

            # 创建目录（如果不存在）
            os.makedirs(os.path.dirname(self.excel_file_path), exist_ok=True)
            
            # 写入Excel文件
            df.to_excel(self.excel_file_path, index=False, engine='openpyxl')
            
            logger.info(f"成功写入 {len(data)} 条生产订单数据到 {self.excel_file_path}")
            return True
            
        except Exception as e:
            logger.error(f"写入Excel文件失败: {str(e)}")
            return False

    def _normalize_priority_df(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        根据Priority排序并将Priority重排为连续的1..N。

        - 非数字或缺失Priority在清理阶段已转为0；此处统一参与排序。
        - 排序后重置Priority为1..N，保证连续。
        """
        if 'Priority' in df.columns:
            # 确保为数值类型，避免排序异常
            df['Priority'] = pd.to_numeric(df['Priority'], errors='coerce').fillna(0).astype(int)
            # 先按Priority升序排序，保持稳定性
            df = df.sort_values(by=['Priority'], ascending=True, kind='stable').reset_index(drop=True)
            # 重排Priority为1..N
            df['Priority'] = range(1, len(df) + 1)
        
        # 维持列顺序
        df = df.reindex(columns=self.columns, fill_value='')
        return df
    
    def add_order(self, order_data: Dict[str, Any]) -> bool:
        """
        添加新的生产订单
        
        Args:
            order_data: 订单数据字典
            
        Returns:
            bool: 添加是否成功
        """
        try:
            # 读取并归一化现有数据（确保优先级从1开始且连续）
            existing_data = self.read_excel_data()
            total = len(existing_data)

            # 期望插入的优先级位置（1..N+1），默认追加到末尾
            try:
                desired_priority = int(order_data.get('Priority', total + 1))
            except Exception:
                desired_priority = total + 1

            if desired_priority < 1:
                desired_priority = 1
            if desired_priority > total + 1:
                desired_priority = total + 1

            # 根据位置插入：将该位置及之后的元素后移
            # 先确保现有数据根据Priority排序（read_excel_data已处理），然后进行插入
            insert_index = desired_priority - 1
            new_list = []
            # 前半部分保持不变
            new_list.extend(existing_data[:insert_index])
            # 插入新订单（临时设置Priority，稍后统一重排）
            order_copy = dict(order_data)
            order_copy['Priority'] = desired_priority
            new_list.append(order_copy)
            # 后半部分跟随其后
            new_list.extend(existing_data[insert_index:])

            # 统一重排Priority为1..N以保持连续
            for idx, rec in enumerate(new_list, start=1):
                rec['Priority'] = idx
            
            # 写回文件（write_excel_data内也会执行归一化，保持稳定）
            return self.write_excel_data(new_list)
            
        except Exception as e:
            logger.error(f"添加订单失败: {str(e)}")
            return False
    
    def update_order(self, order_index: int, order_data: Dict[str, Any]) -> bool:
        """
        更新指定索引的生产订单
        
        Args:
            order_index: 订单索引
            order_data: 更新后的订单数据
            
        Returns:
            bool: 更新是否成功
        """
        try:
            # 读取现有数据
            existing_data = self.read_excel_data()
            
            # 检查索引是否有效
            if 0 <= order_index < len(existing_data):
                existing_data[order_index] = order_data
                
                # 写回文件
                return self.write_excel_data(existing_data)
            else:
                logger.error(f"订单索引 {order_index} 超出范围")
                return False
                
        except Exception as e:
            logger.error(f"更新订单失败: {str(e)}")
            return False
    
    def delete_order(self, order_index: int) -> bool:
        """
        删除指定索引的生产订单
        
        Args:
            order_index: 订单索引
            
        Returns:
            bool: 删除是否成功
        """
        try:
            # 读取现有数据
            existing_data = self.read_excel_data()
            
            # 检查索引是否有效
            if 0 <= order_index < len(existing_data):
                existing_data.pop(order_index)
                
                # 写回文件
                return self.write_excel_data(existing_data)
            else:
                logger.error(f"订单索引 {order_index} 超出范围")
                return False
                
        except Exception as e:
            logger.error(f"删除订单失败: {str(e)}")
            return False

    def delete_order_by_production_order(self, production_order: str) -> bool:
        """
        根据生产订单号删除对应订单（精确匹配，忽略前后空格）

        Args:
            production_order: 生产订单号

        Returns:
            bool: 删除是否成功
        """
        try:
            target = str(production_order).strip()
            existing_data = self.read_excel_data()

            index_to_delete = None
            for idx, rec in enumerate(existing_data):
                val = str(rec.get('Production_order', '')).strip()
                if val == target:
                    index_to_delete = idx
                    break

            if index_to_delete is not None:
                existing_data.pop(index_to_delete)
                return self.write_excel_data(existing_data)
            else:
                logger.warning(f"未找到生产订单号: {target}")
                return False
        except Exception as e:
            logger.error(f"按生产订单号删除订单失败: {str(e)}")
            return False

    def delete_orders_by_production_orders(self, production_orders: List[str]) -> Dict[str, Any]:
        """
        批量根据生产订单号删除订单（一次读取、一次写入，避免并发写入问题）

        Args:
            production_orders: 生产订单号列表

        Returns:
            Dict: { success, removed, requested }
        """
        try:
            targets = {str(po).strip() for po in (production_orders or []) if str(po).strip()}
            if not targets:
                return {"success": False, "removed": 0, "requested": 0, "message": "空的订单号列表"}

            existing_data = self.read_excel_data()
            before_count = len(existing_data)

            new_data = []
            removed = 0
            for rec in existing_data:
                po = str(rec.get('Production_order', '')).strip()
                if po in targets:
                    removed += 1
                else:
                    new_data.append(rec)

            write_ok = self.write_excel_data(new_data)
            success = write_ok and removed > 0
            return {"success": success, "removed": removed, "requested": len(targets)}
        except Exception as e:
            logger.error(f"批量按生产订单号删除订单失败: {str(e)}")
            return {"success": False, "removed": 0, "requested": len(production_orders or [])}
    
    def _validate_and_clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        验证和清理数据
        
        Args:
            df: 原始DataFrame
            
        Returns:
            pd.DataFrame: 清理后的DataFrame
        """
        # 确保必要的列存在
        for col in self.columns:
            if col not in df.columns:
                df[col] = ''
        
        # 处理日期格式
        date_columns = ['Delivery_date', 'Scheduled_date']
        for col in date_columns:
            if col in df.columns:
                df[col] = pd.to_datetime(df[col], errors='coerce').dt.strftime('%Y-%m-%d')
                df[col] = df[col].fillna('')
        
        # 处理数字列
        numeric_columns = ['Priority', 'Pieces_finished', 'Pieces_intended']
        for col in numeric_columns:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        
        # 处理文本列缺失值：确保返回JSON不包含NaN/None
        text_columns = [col for col in df.columns if col not in numeric_columns + date_columns]
        if text_columns:
            df[text_columns] = df[text_columns].fillna('')

        # 不再保存进度列；若Excel中存在则读取但写出时会丢弃
        
        return df
    
    def export_to_json(self, data: Optional[List[Dict[str, Any]]] = None) -> str:
        """
        将数据导出为JSON格式
        
        Args:
            data: 数据列表，如果为None则读取现有数据
            
        Returns:
            str: JSON格式的数据
        """
        try:
            if data is None:
                data = self.read_excel_data()
            
            return json.dumps(data, ensure_ascii=False, indent=2, default=str)
            
        except Exception as e:
            logger.error(f"导出JSON失败: {str(e)}")
            return "[]"
    
    def import_from_json(self, json_data: str) -> bool:
        """
        从JSON格式导入数据
        
        Args:
            json_data: JSON格式的数据
            
        Returns:
            bool: 导入是否成功
        """
        try:
            data = json.loads(json_data)
            return self.write_excel_data(data)
            
        except Exception as e:
            logger.error(f"导入JSON失败: {str(e)}")
            return False
            
    def _get_timestamp(self) -> str:
        """获取当前时间戳"""
        return datetime.now().isoformat()


# ==================== API接口预留空间 ====================

class OrganizerAPI:
    """API接口类 - 预留空间供后续开发"""
    
    def __init__(self, data_processor: OrganizerTableData):
        """
        初始化API接口
        
        Args:
            data_processor: OrganizerTableData实例
        """
        self.data_processor = data_processor
    
    def handle_get_request(self, request_params: Dict[str, Any]) -> Dict[str, Any]:
        """
        处理GET请求 - 获取数据
        
        Args:
            request_params: 请求参数
            
        Returns:
            Dict: 响应数据
        """
        try:
            # 预留：根据请求参数过滤数据
            data = self.data_processor.read_excel_data()
            
            return {
                "status": "success",
                "data": data,
                "count": len(data),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    def handle_post_request(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        处理POST请求 - 添加/更新数据
        
        Args:
            request_data: 请求数据
            
        Returns:
            Dict: 响应数据
        """
        try:
            # 预留：根据请求类型处理不同的操作
            action = request_data.get('action', 'add')
            order_data = request_data.get('data', {})
            
            if action == 'add':
                success = self.data_processor.add_order(order_data)
                message = "订单添加成功" if success else "订单添加失败"
            elif action == 'update':
                order_index = request_data.get('index', -1)
                success = self.data_processor.update_order(order_index, order_data)
                message = "订单更新成功" if success else "订单更新失败"
            elif action == 'delete':
                order_index = request_data.get('index', -1)
                success = self.data_processor.delete_order(order_index)
                message = "订单删除成功" if success else "订单删除失败"
            else:
                success = False
                message = "未知的操作类型"
            
            return {
                "status": "success" if success else "error",
                "message": message,
                "success": success,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def delete_order_by_production_order(self, production_order: str) -> Dict[str, Any]:
        """
        处理按生产订单号删除的请求

        Args:
            production_order: 生产订单号

        Returns:
            Dict: 响应数据
        """
        try:
            success = self.data_processor.delete_order_by_production_order(production_order)
            message = "订单删除成功" if success else "未找到该生产订单或删除失败"
            return {
                "status": "success" if success else "error",
                "message": message,
                "success": success,
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "status": "error",
                "message": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def delete_orders_by_production_orders(self, production_orders: List[str]) -> Dict[str, Any]:
        """
        处理批量按生产订单号删除的请求

        Args:
            production_orders: 生产订单号列表

        Returns:
            Dict: 响应数据，包含删除数量
        """
        try:
            result = self.data_processor.delete_orders_by_production_orders(production_orders)
            message = f"成功删除 {result.get('removed', 0)} 个订单" if result.get('success') else "批量删除失败或未找到订单"
            return {
                "status": "success" if result.get('success') else "error",
                "message": message,
                "success": result.get('success', False),
                "removed": result.get('removed', 0),
                "requested": result.get('requested', 0),
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "status": "error",
                "message": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    def handle_file_upload(self, file_data: bytes, filename: str) -> Dict[str, Any]:
        """
        处理文件上传 - 预留接口
        
        Args:
            file_data: 文件二进制数据
            filename: 文件名
            
        Returns:
            Dict: 响应数据
        """
        # 预留：处理Excel文件上传
        return {
            "status": "info",
            "message": "文件上传功能预留",
            "filename": filename,
            "timestamp": datetime.now().isoformat()
        }


# ==================== 测试和示例代码 ====================

def create_sample_data():
    """创建示例数据"""
    return [
        {
            'Priority': 50,
            'Status': 'Active',
            'Production_order': 'FA_401001_R2017',
            'Part_type': '4_318220',
            'Pieces_finished': 2,
            'Pieces_intended': 50,
            'Delivery_date': '2017-09-26',
            'Scheduled_date': '2018-09-26'
        },
        {
            'Priority': 10,
            'Status': 'Active',
            'Production_order': 'FA_401002_R2017',
            'Part_type': '4_312000_WSG1',
            'Pieces_finished': 0,
            'Pieces_intended': 60,
            'Delivery_date': '2017-10-04',
            'Scheduled_date': '2018-10-04'
        },
        {
            'Priority': 11,
            'Status': 'Active',
            'Production_order': 'FA_401003_R2016',
            'Part_type': '4_313000_WSG2',
            'Pieces_finished': 0,
            'Pieces_intended': 100,
            'Delivery_date': '2017-10-02',
            'Scheduled_date': '2018-10-02'
        }
    ]


if __name__ == "__main__":
    # 测试代码
    print("生产订单表格数据处理模块测试")
    print("=" * 50)
    
    # 创建数据处理实例
    processor = OrganizerTableData("data/production_orders.xlsx")
    
    # 创建示例数据
    sample_data = create_sample_data()
    print(f"创建示例数据: {len(sample_data)} 条记录")
    
    # 写入Excel
    success = processor.write_excel_data(sample_data)
    print(f"写入Excel文件: {'成功' if success else '失败'}")
    
    # 读取Excel
    read_data = processor.read_excel_data()
    print(f"读取Excel文件: {len(read_data)} 条记录")
    
    # 导出为JSON
    json_data = processor.export_to_json()
    print(f"导出JSON数据长度: {len(json_data)} 字符")
    
    # 测试API接口
    api = OrganizerAPI(processor)
    
    # 测试GET请求
    get_response = api.handle_get_request({})
    print(f"GET API响应: {get_response['status']}")
    
    # 测试POST请求
    new_order = {
        'Priority': 15,
        'Status': 'New',
        'Production_order': 'FA_401004_R2017',
        'Part_type': '4_314000_TEST',
        'Pieces_finished': 0,
        'Pieces_intended': 25,
        'Delivery_date': '2017-11-15',
        'Scheduled_date': '2018-11-15'
    }
    
    post_response = api.handle_post_request({
        'action': 'add',
        'data': new_order
    })
    print(f"POST API响应: {post_response['status']} - {post_response['message']}")
    
    print("\n测试完成！")
    print("=" * 50)