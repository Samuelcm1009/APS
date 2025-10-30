/**
 * 数据管理模块
 * 负责处理生产订单数据的持久化存储
 * 使用localStorage作为本地存储方案
 */

class DataManager {
    constructor() {
        this.storageKey = 'productionOrders';
        this.init();
    }

    /**
     * 初始化数据管理器
     */
    init() {
        // 如果localStorage中没有数据，初始化为空数组
        if (!localStorage.getItem(this.storageKey)) {
            this.saveData([]);
        }
    }

    /**
     * 获取所有订单数据
     * @returns {Array} 订单数据数组
     */
    getAllOrders() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('读取数据失败:', error);
            return [];
        }
    }

    /**
     * 保存数据到localStorage
     * @param {Array} data - 要保存的数据
     */
    saveData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('保存数据失败:', error);
            return false;
        }
    }

    /**
     * 添加新订单
     * @param {Object} orderData - 订单数据
     * @returns {boolean} 是否添加成功
     */
    addOrder(orderData) {
        try {
            const orders = this.getAllOrders();
            
            // 生成唯一ID
            const newOrder = {
                id: this.generateId(),
                ...orderData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            orders.push(newOrder);
            return this.saveData(orders);
        } catch (error) {
            console.error('添加订单失败:', error);
            return false;
        }
    }

    /**
     * 根据ID删除订单
     * @param {string} orderId - 订单ID
     * @returns {boolean} 是否删除成功
     */
    deleteOrder(orderId) {
        try {
            const orders = this.getAllOrders();
            const filteredOrders = orders.filter(order => order.id !== orderId);
            return this.saveData(filteredOrders);
        } catch (error) {
            console.error('删除订单失败:', error);
            return false;
        }
    }

    /**
     * 批量删除订单
     * @param {Array} orderIds - 订单ID数组
     * @returns {boolean} 是否删除成功
     */
    deleteOrders(orderIds) {
        try {
            const orders = this.getAllOrders();
            const filteredOrders = orders.filter(order => !orderIds.includes(order.id));
            return this.saveData(filteredOrders);
        } catch (error) {
            console.error('批量删除订单失败:', error);
            return false;
        }
    }

    /**
     * 更新订单
     * @param {string} orderId - 订单ID
     * @param {Object} updateData - 更新的数据
     * @returns {boolean} 是否更新成功
     */
    updateOrder(orderId, updateData) {
        try {
            const orders = this.getAllOrders();
            const orderIndex = orders.findIndex(order => order.id === orderId);
            
            if (orderIndex === -1) {
                console.error('订单不存在:', orderId);
                return false;
            }
            
            orders[orderIndex] = {
                ...orders[orderIndex],
                ...updateData,
                updatedAt: new Date().toISOString()
            };
            
            return this.saveData(orders);
        } catch (error) {
            console.error('更新订单失败:', error);
            return false;
        }
    }

    /**
     * 根据ID获取订单
     * @param {string} orderId - 订单ID
     * @returns {Object|null} 订单数据或null
     */
    getOrderById(orderId) {
        try {
            const orders = this.getAllOrders();
            return orders.find(order => order.id === orderId) || null;
        } catch (error) {
            console.error('获取订单失败:', error);
            return null;
        }
    }

    /**
     * 生成唯一ID
     * @returns {string} 唯一ID
     */
    generateId() {
        return 'order_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 清空所有数据
     * @returns {boolean} 是否清空成功
     */
    clearAllData() {
        try {
            localStorage.removeItem(this.storageKey);
            this.init();
            return true;
        } catch (error) {
            console.error('清空数据失败:', error);
            return false;
        }
    }

    /**
     * 导出数据为JSON格式
     * @returns {string} JSON字符串
     */
    exportToJSON() {
        try {
            const orders = this.getAllOrders();
            return JSON.stringify(orders, null, 2);
        } catch (error) {
            console.error('导出数据失败:', error);
            return null;
        }
    }

    /**
     * 从JSON数据导入
     * @param {string} jsonData - JSON字符串
     * @returns {boolean} 是否导入成功
     */
    importFromJSON(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (Array.isArray(data)) {
                return this.saveData(data);
            } else {
                console.error('导入数据格式错误');
                return false;
            }
        } catch (error) {
            console.error('导入数据失败:', error);
            return false;
        }
    }

    /**
     * 获取数据统计信息
     * @returns {Object} 统计信息
     */
    getStatistics() {
        try {
            const orders = this.getAllOrders();
            return {
                totalOrders: orders.length,
                totalPlannedQuantity: orders.reduce((sum, order) => sum + (order.plannedQuantity || 0), 0),
                totalCurrentQuantity: orders.reduce((sum, order) => sum + (order.currentQuantity || 0), 0),
                completionRate: orders.length > 0 ? 
                    (orders.reduce((sum, order) => sum + (order.currentQuantity || 0), 0) / 
                     orders.reduce((sum, order) => sum + (order.plannedQuantity || 0), 0) * 100).toFixed(2) : 0
            };
        } catch (error) {
            console.error('获取统计信息失败:', error);
            return {
                totalOrders: 0,
                totalPlannedQuantity: 0,
                totalCurrentQuantity: 0,
                completionRate: 0
            };
        }
    }
}

// 创建全局数据管理器实例
window.dataManager = new DataManager();