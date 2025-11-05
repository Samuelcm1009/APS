#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生产订单数据API服务器
Production Order Data API Server

提供RESTful API接口供前端调用
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from organizer_table_data import OrganizerTableData, OrganizerAPI
import json
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 创建Flask应用
app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 初始化数据处理实例
data_processor = OrganizerTableData("data/production_orders.xlsx")
api_handler = OrganizerAPI(data_processor)


@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return jsonify({
        "status": "healthy",
        "message": "生产订单API服务器运行正常",
        "timestamp": data_processor._get_timestamp()
    })


@app.route('/api/orders', methods=['GET'])
def get_orders():
    """获取所有生产订单"""
    try:
        # 获取请求参数
        params = request.args.to_dict()
        
        # 调用API处理函数
        response = api_handler.handle_get_request(params)
        
        return jsonify(response), 200 if response['status'] == 'success' else 400
        
    except Exception as e:
        logger.error(f"获取订单失败: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e),
            "timestamp": data_processor._get_timestamp()
        }), 500


@app.route('/api/orders', methods=['POST'])
def create_order():
    """创建新的生产订单"""
    try:
        # 获取请求数据
        request_data = request.get_json()
        
        if not request_data:
            return jsonify({
                "status": "error",
                "message": "请求数据不能为空",
                "timestamp": data_processor._get_timestamp()
            }), 400
        
        # 设置默认操作为添加
        request_data['action'] = 'add'
        
        # 调用API处理函数
        response = api_handler.handle_post_request(request_data)
        
        return jsonify(response), 200 if response['success'] else 400
        
    except Exception as e:
        logger.error(f"创建订单失败: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e),
            "timestamp": data_processor._get_timestamp()
        }), 500


@app.route('/api/orders/<int:order_index>', methods=['PUT'])
def update_order(order_index):
    """更新指定索引的生产订单"""
    try:
        # 获取请求数据
        request_data = request.get_json()
        
        if not request_data:
            return jsonify({
                "status": "error",
                "message": "请求数据不能为空",
                "timestamp": data_processor._get_timestamp()
            }), 400
        
        # 设置操作类型和索引
        request_data['action'] = 'update'
        request_data['index'] = order_index
        
        # 调用API处理函数
        response = api_handler.handle_post_request(request_data)
        
        return jsonify(response), 200 if response['success'] else 400
        
    except Exception as e:
        logger.error(f"更新订单失败: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e),
            "timestamp": data_processor._get_timestamp()
        }), 500


@app.route('/api/orders/<int:order_index>', methods=['DELETE'])
def delete_order(order_index):
    """删除指定索引的生产订单"""
    try:
        # 创建删除请求数据
        request_data = {
            'action': 'delete',
            'index': order_index
        }
        
        # 调用API处理函数
        response = api_handler.handle_post_request(request_data)
        
        return jsonify(response), 200 if response['success'] else 400
        
    except Exception as e:
        logger.error(f"删除订单失败: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e),
            "timestamp": data_processor._get_timestamp()
        }), 500


@app.route('/api/orders/export', methods=['GET'])
def export_orders():
    """导出订单数据为JSON格式"""
    try:
        # 获取所有数据
        data = data_processor.read_excel_data()
        
        # 导出为JSON
        json_data = data_processor.export_to_json(data)
        
        # 返回JSON响应
        response = app.response_class(
            response=json_data,
            status=200,
            mimetype='application/json'
        )
        
        return response
        
    except Exception as e:
        logger.error(f"导出订单失败: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e),
            "timestamp": data_processor._get_timestamp()
        }), 500


@app.route('/api/orders/import', methods=['POST'])
def import_orders():
    """从JSON导入订单数据"""
    try:
        # 获取请求数据
        request_data = request.get_json()
        
        if not request_data or 'data' not in request_data:
            return jsonify({
                "status": "error",
                "message": "请求数据必须包含'data'字段",
                "timestamp": data_processor._get_timestamp()
            }), 400
        
        # 导入数据
        json_data = json.dumps(request_data['data'], ensure_ascii=False)
        success = data_processor.import_from_json(json_data)
        
        return jsonify({
            "status": "success" if success else "error",
            "message": "数据导入成功" if success else "数据导入失败",
            "success": success,
            "timestamp": data_processor._get_timestamp()
        }), 200 if success else 400
        
    except Exception as e:
        logger.error(f"导入订单失败: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e),
            "timestamp": data_processor._get_timestamp()
        }), 500


@app.route('/api/orders/upload', methods=['POST'])
def upload_file():
    """上传Excel文件"""
    try:
        if 'file' not in request.files:
            return jsonify({
                "status": "error",
                "message": "没有上传文件",
                "timestamp": data_processor._get_timestamp()
            }), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({
                "status": "error",
                "message": "文件名为空",
                "timestamp": data_processor._get_timestamp()
            }), 400
        
        # 检查文件扩展名
        if not file.filename.endswith('.xlsx'):
            return jsonify({
                "status": "error",
                "message": "只支持.xlsx格式的Excel文件",
                "timestamp": data_processor._get_timestamp()
            }), 400
        
        # 读取文件数据
        file_data = file.read()
        
        # 调用文件上传处理
        response = api_handler.handle_file_upload(file_data, file.filename)
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"文件上传失败: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e),
            "timestamp": data_processor._get_timestamp()
        }), 500


# 错误处理
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "status": "error",
        "message": "接口不存在",
        "timestamp": data_processor._get_timestamp()
    }), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        "status": "error",
        "message": "服务器内部错误",
        "timestamp": data_processor._get_timestamp()
    }), 500


if __name__ == '__main__':
    print("启动生产订单数据API服务器...")
    print("API端点:")
    print("  GET  /api/health      - 健康检查")
    print("  GET  /api/orders      - 获取所有订单")
    print("  POST /api/orders      - 创建新订单")
    print("  PUT  /api/orders/<id> - 更新订单")
    print("  DELETE /api/orders/<id> - 删除订单")
    print("  GET  /api/orders/export - 导出订单")
    print("  POST /api/orders/import - 导入订单")
    print("  POST /api/orders/upload - 上传文件")
    print("")
    print("服务器运行在: http://localhost:5000")
    print("=" * 50)
    
    # 运行服务器
    app.run(host='0.0.0.0', port=5000, debug=True)