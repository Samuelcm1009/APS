/**
 * 新建生产订单弹窗管理
 * Modal Management for New Production Order
 */

// 增强日期输入功能
function enhanceDateInputs() {
    const dateInputs = document.querySelectorAll('.date-input');
    
    dateInputs.forEach(input => {
        // 添加日期选择事件
        input.addEventListener('change', function() {
            const helper = this.nextElementSibling;
            
            if (this.value) {
                this.setCustomValidity('');
                helper.textContent = 'Date selected';
                helper.style.color = '#4CAF50';
            }
        });
        
        // 添加焦点事件
        input.addEventListener('focus', function() {
            const helper = this.nextElementSibling;
            helper.textContent = 'Please select a date';
            helper.style.color = '#2196F3';
        });
        
        // 添加失焦事件
        input.addEventListener('blur', function() {
            if (!this.value) {
                const helper = this.nextElementSibling;
                helper.textContent = 'Please select a date';
                helper.style.color = '#888888';
            }
        });
    });
}

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    enhanceDateInputs();
    // 获取弹窗元素
    const modal = document.getElementById('newOrderModal');
    const createBtn = document.querySelector('.btn-create');
    const closeBtn = document.querySelector('.close');
    const cancelBtn = document.querySelector('.btn-cancel');
    const form = document.getElementById('newOrderForm');

    /**
     * 显示弹窗
     */
    function showModal() {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // 防止背景滚动
    }

    /**
     * 隐藏弹窗
     */
    function hideModal() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // 恢复背景滚动
        form.reset(); // 重置表单
    }

    /**
     * 验证表单数据
     * @param {FormData} formData - 表单数据
     * @returns {boolean} - 验证结果
     */
    function validateForm(formData) {
        const productionOrder = formData.get('productionOrder').trim();
        const partType = formData.get('partType').trim();
        const productionCompany = formData.get('productionCompany').trim();
        const plannedQuantity = formData.get('plannedQuantity');
        const deliveryDate = formData.get('deliveryDate');
        const scheduledDate = formData.get('scheduledDate');

        // 检查必填字段
        if (!productionOrder || !partType || !productionCompany || !plannedQuantity || !deliveryDate || !scheduledDate) {
            alert('请填写所有必填字段！');
            return false;
        }

        // 检查计划产量是否为正整数
        const quantity = parseInt(plannedQuantity);
        if (isNaN(quantity) || quantity <= 0) {
            alert('计划产量必须是大于0的整数！');
            return false;
        }

        // 检查目前完成产量
        const currentQuantity = formData.get('currentQuantity');
        if (currentQuantity && currentQuantity.trim() !== '') {
            const current = parseInt(currentQuantity);
            if (isNaN(current) || current < 0) {
                alert('目前完成产量必须是大于等于0的整数！');
                return false;
            }
            if (current > quantity) {
                alert('目前完成产量不能大于计划产量！');
                return false;
            }
        }

        // 检查日期有效性
        const delivery = new Date(deliveryDate);
        const scheduled = new Date(scheduledDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // if (delivery < today) {
        //     alert('交付日期不能早于今天！');
        //     return false;
        // }

        // if (scheduled < today) {
        //     alert('计划日期不能早于今天！');
        //     return false;
        // }

        return true;
    }

    /**
     * 格式化日期为显示格式
     * @param {string} dateString - 日期字符串
     * @returns {string} - 格式化后的日期
     */
    function formatDate(dateString) {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    }

    /**
     * 添加新订单到表格
     * @param {Object} orderData - 订单数据
     * @param {string} orderId - 订单ID（可选，用于从存储加载数据时）
     */
    function addOrderToTable(orderData, orderId = null) {
        const tableBody = document.querySelector('.production-table tbody');
        const newRow = document.createElement('tr');
        
        // 如果没有提供orderId，说明是新添加的订单，需要保存到数据管理器
        if (!orderId && window.dataManager) {
            const success = window.dataManager.addOrder(orderData);
            if (!success) {
                alert('保存订单失败，请重试！');
                return;
            }
            // 获取刚保存的订单ID
            const orders = window.dataManager.getAllOrders();
            orderId = orders[orders.length - 1].id;
        }
        
        // 设置行的数据属性
        if (orderId) {
            newRow.setAttribute('data-order-id', orderId);
        }
        
        // 获取新的序号（当前行数 + 1）
        const rowCount = tableBody.children.length + 1;
        
        newRow.innerHTML = `
            <td class="checkbox-cell" style="display: none;">
                <input type="checkbox" class="row-checkbox">
            </td>
            <td class="radio-cell" style="display: none;">
                <input type="radio" name="selectedRow" class="row-radio">
            </td>
            <td class="col-priority">${orderData.priority || rowCount}</td>
            <td><span class="status-indicator status-green"></span></td>
            <td>
                <div class="order-info">
                    <div class="order-number">${orderData.productionOrder}</div>
                    <div class="order-company">新建订单</div>
                </div>
            </td>
            <td>
                <div class="part-info">
                    <div class="part-number">${orderData.partType}</div>
                    <div class="part-name">${orderData.productionCompany || '未指定公司'}</div>
                </div>
            </td>
            <td>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min((orderData.currentQuantity / orderData.plannedQuantity) * 100, 100)}%;"></div>
                </div>
            </td>
            <td>${orderData.currentQuantity} / ${orderData.plannedQuantity}</td>
            <td>
                <div class="delivery-date">${formatDate(orderData.deliveryDate)}</div>
            </td>
            <td>
                <div class="schedule-date">${formatDate(orderData.scheduledDate)}</div>
            </td>
        `;
        
        // 添加行动画效果
        newRow.style.opacity = '0';
        newRow.style.transform = 'translateY(20px)';
        tableBody.appendChild(newRow);
        
        // 触发动画
        setTimeout(() => {
            newRow.style.transition = 'all 0.5s ease';
            newRow.style.opacity = '1';
            newRow.style.transform = 'translateY(0)';
            
            // 如果当前处于删除模式，为新行添加可点击样式
            if (isDeleteMode) {
                newRow.classList.add('clickable-row');
            }
        }, 100);
    }

    /**
     * 插入订单到指定Priority位置
     * @param {Object} orderData - 订单数据
     */
    function insertOrderAtPriority(orderData) {
        const tableBody = document.querySelector('.production-table tbody');
        const rows = Array.from(tableBody.children);
        const targetPriority = orderData.priority;
        
        // 找到插入位置
        let insertIndex = rows.length; // 默认插入到末尾
        
        for (let i = 0; i < rows.length; i++) {
            const currentPriority = parseInt(rows[i].children[2].textContent) || 9999;
            if (targetPriority <= currentPriority) {
                insertIndex = i;
                break;
            }
        }
        
        // 创建新行
        const newRow = document.createElement('tr');
        let orderId = null;
        
        // 保存到数据管理器
        if (window.dataManager) {
            const success = window.dataManager.addOrder(orderData);
            if (!success) {
                alert('保存订单失败，请重试！');
                return;
            }
            // 获取刚保存的订单ID
            const orders = window.dataManager.getAllOrders();
            orderId = orders[orders.length - 1].id;
        }
        
        // 设置行的数据属性
        if (orderId) {
            newRow.setAttribute('data-order-id', orderId);
        }
        
        newRow.innerHTML = `
            <td class="checkbox-cell" style="display: none;">
                <input type="checkbox" class="row-checkbox">
            </td>
            <td class="radio-cell" style="display: none;">
                <input type="radio" name="selectedRow" class="row-radio">
            </td>
            <td class="col-priority">${targetPriority}</td>
            <td><span class="status-indicator status-green"></span></td>
            <td>
                <div class="order-info">
                    <div class="order-number">${orderData.productionOrder}</div>
                    <div class="order-company">新建订单</div>
                </div>
            </td>
            <td>
                <div class="part-info">
                    <div class="part-number">${orderData.partType}</div>
                    <div class="part-name">${orderData.productionCompany || '未指定公司'}</div>
                </div>
            </td>
            <td>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min((orderData.currentQuantity / orderData.plannedQuantity) * 100, 100)}%;"></div>
                </div>
            </td>
            <td>${orderData.currentQuantity} / ${orderData.plannedQuantity}</td>
            <td>
                <div class="delivery-date">${formatDate(orderData.deliveryDate)}</div>
            </td>
            <td>
                <div class="schedule-date">${formatDate(orderData.scheduledDate)}</div>
            </td>
        `;
        
        // 插入到指定位置
        if (insertIndex >= rows.length) {
            tableBody.appendChild(newRow);
        } else {
            tableBody.insertBefore(newRow, rows[insertIndex]);
        }
        
        // 重新排序Priority列
        reorderPriorityColumn();
        
        // 添加行动画效果
        newRow.style.opacity = '0';
        newRow.style.transform = 'translateY(20px)';
        
        // 触发动画
        setTimeout(() => {
            newRow.style.transition = 'all 0.5s ease';
            newRow.style.opacity = '1';
            newRow.style.transform = 'translateY(0)';
            
            // 如果当前处于删除模式，为新行添加可点击样式
            if (isDeleteMode) {
                newRow.classList.add('clickable-row');
            }
        }, 100);
    }

    /**
     * 重新排序Priority列，使数值保持连续
     */
    function reorderPriorityColumn() {
        const tableBody = document.querySelector('.production-table tbody');
        const rows = Array.from(tableBody.children);
        
        // 更新每行的Priority值为连续数字
        rows.forEach((row, index) => {
            const priorityCell = row.querySelector('.col-priority');
            if (priorityCell) {
                priorityCell.textContent = index + 1;
            }
        });
        
        // 同步到数据存储
        syncPriorityToStorage();
    }

    /**
     * 同步Priority更改到数据存储
     */
    function syncPriorityToStorage() {
        if (!window.dataManager) return;
        
        const tableBody = document.querySelector('.production-table tbody');
        const rows = Array.from(tableBody.children);
        const reorderedData = [];
        
        rows.forEach((row, index) => {
            const orderId = row.getAttribute('data-order-id');
            if (orderId) {
                const orderData = window.dataManager.getOrderById(orderId);
                if (orderData) {
                    orderData.priority = index + 1;
                    reorderedData.push(orderData);
                }
            }
        });
        
        // 使用reorderOrders方法更新数据
        if (reorderedData.length > 0) {
            window.dataManager.reorderOrders(reorderedData);
        }
    }

    /**
     * 处理表单提交
     * @param {Event} event - 提交事件
     */
    function handleFormSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(form);
        
        // 验证表单
        if (!validateForm(formData)) {
            return;
        }

        // 获取表单数据
        const orderData = {
            productionOrder: formData.get('productionOrder').trim(),
            partType: formData.get('partType').trim(),
            productionCompany: formData.get('productionCompany').trim(),
            plannedQuantity: parseInt(formData.get('plannedQuantity')),
            currentQuantity: parseInt(formData.get('currentQuantity')) || 0,
            deliveryDate: formData.get('deliveryDate'),
            scheduledDate: formData.get('scheduledDate'),
            priority: parseInt(formData.get('priority')) || 9999
        };

        // 插入到指定Priority位置
        insertOrderAtPriority(orderData);

        // 显示成功消息
        // alert('新生产订单创建成功！');

        // 隐藏弹窗
        hideModal();

        console.log('新建生产订单:', orderData);
    }

    // 事件监听器
    if (createBtn) {
        createBtn.addEventListener('click', showModal);
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', hideModal);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideModal);
    }

    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }

    // 导出Excel按钮事件监听器
    const exportBtn = document.querySelector('.btn-export');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            if (window.dataManager) {
                window.dataManager.exportToExcel();
            } else {
                alert('数据管理器未初始化');
            }
        });
    }

    // 点击弹窗背景关闭弹窗
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            hideModal();
        }
    });

    // ESC键关闭弹窗
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modal.style.display === 'block') {
            hideModal();
        }
    });

    // 表单输入实时验证
    const inputs = form.querySelectorAll('input[required]');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value.trim() === '') {
                this.style.borderColor = '#f44336';
            } else {
                this.style.borderColor = '#4CAF50';
            }
        });

        input.addEventListener('input', function() {
            if (this.value.trim() !== '') {
                this.style.borderColor = '#4CAF50';
            }
        });
    });

    // 删除生产订单功能
    const deleteBtn = document.querySelector('.btn-delete');
    let isDeleteMode = false;
    let selectedRows = new Set();

    function toggleDeleteMode() {
        isDeleteMode = !isDeleteMode;
        const checkboxCells = document.querySelectorAll('.checkbox-cell');
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        const tableRows = document.querySelectorAll('.production-table tbody tr');
        
        if (isDeleteMode) {
            // 显示复选框
            checkboxCells.forEach(cell => {
                cell.style.display = 'table-cell';
            });
            selectAllCheckbox.style.display = 'inline-block';
            deleteBtn.textContent = '确认删除';
            deleteBtn.classList.add('btn-confirm-delete');
            
            // 为表格行添加可点击样式
            tableRows.forEach(row => {
                row.classList.add('clickable-row');
            });
        } else {
            // 隐藏复选框
            checkboxCells.forEach(cell => {
                cell.style.display = 'none';
            });
            selectAllCheckbox.style.display = 'none';
            deleteBtn.textContent = '删除生产订单';
            deleteBtn.classList.remove('btn-confirm-delete');
            deleteBtn.classList.remove('btn-cancel');
            
            // 移除表格行的可点击样式
            tableRows.forEach(row => {
                row.classList.remove('clickable-row');
            });
            
            // 清除所有选择
            clearAllSelections();
        }
    }

    function clearAllSelections() {
        selectedRows.clear();
        const checkboxes = document.querySelectorAll('.row-checkbox');
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        selectAllCheckbox.checked = false;
    }

    function handleRowSelection(checkbox) {
        const row = checkbox.closest('tr');
        if (checkbox.checked) {
            selectedRows.add(row);
            row.classList.add('selected-for-delete');
        } else {
            selectedRows.delete(row);
            row.classList.remove('selected-for-delete');
        }
        
        // 更新全选复选框状态
        updateSelectAllCheckbox();
        // 更新按钮状态
        updateDeleteButtonState();
    }

    function updateSelectAllCheckbox() {
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        const allCheckboxes = document.querySelectorAll('.row-checkbox');
        const checkedCheckboxes = document.querySelectorAll('.row-checkbox:checked');
        
        if (checkedCheckboxes.length === 0) {
            selectAllCheckbox.indeterminate = false;
            selectAllCheckbox.checked = false;
        } else if (checkedCheckboxes.length === allCheckboxes.length) {
            selectAllCheckbox.indeterminate = false;
            selectAllCheckbox.checked = true;
        } else {
            selectAllCheckbox.indeterminate = true;
        }
    }

    function handleSelectAll(selectAllCheckbox) {
        const allCheckboxes = document.querySelectorAll('.row-checkbox');
        
        allCheckboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
            const row = checkbox.closest('tr');
            if (checkbox.checked) {
                selectedRows.add(row);
                row.classList.add('selected-for-delete');
            } else {
                selectedRows.delete(row);
                row.classList.remove('selected-for-delete');
            }
        });
        
        // 更新按钮状态
        updateDeleteButtonState();
    }

    function confirmDelete() {
        if (selectedRows.size === 0) {
            alert('请选择要删除的生产订单');
            return;
        }

        const confirmMessage = `确定要删除选中的 ${selectedRows.size} 个生产订单吗？此操作不可撤销。`;
        
        if (confirm(confirmMessage)) {
            // 收集要删除的订单ID
            const orderIdsToDelete = [];
            selectedRows.forEach(row => {
                const orderId = row.getAttribute('data-order-id');
                if (orderId) {
                    orderIdsToDelete.push(orderId);
                }
            });
            
            // 从数据存储中删除
            if (window.dataManager && orderIdsToDelete.length > 0) {
                const success = window.dataManager.deleteOrders(orderIdsToDelete);
                if (!success) {
                    alert('删除数据失败，请重试！');
                    return;
                }
            }
            
            // 删除选中的行
            selectedRows.forEach(row => {
                row.remove();
            });
            
            // 重新编号
            renumberTable();
            
            // 退出删除模式
            toggleDeleteMode();
            
            console.log(`成功删除 ${selectedRows.size} 个生产订单`);
        }
    }

    function renumberTable() {
        const rows = document.querySelectorAll('.production-table tbody tr');
        rows.forEach((row, index) => {
            const numberCell = row.querySelector('td:nth-child(2)'); // 第二列是编号列（第一列是复选框）
            if (numberCell) {
                numberCell.textContent = index + 1;
            }
        });
    }

    function updateDeleteButtonState() {
        if (!isDeleteMode) return;
        
        if (selectedRows.size === 0) {
            deleteBtn.textContent = '取消';
            deleteBtn.classList.remove('btn-confirm-delete');
            deleteBtn.classList.add('btn-cancel');
        } else {
            deleteBtn.textContent = '确认删除';
            deleteBtn.classList.remove('btn-cancel');
            deleteBtn.classList.add('btn-confirm-delete');
        }
    }

    function exitDeleteMode() {
        if (isDeleteMode) {
            toggleDeleteMode();
        }
    }

    // 事件监听器
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            if (isDeleteMode) {
                if (selectedRows.size === 0) {
                    // 取消按钮 - 退出删除模式
                    exitDeleteMode();
                } else {
                    // 确认删除按钮
                    confirmDelete();
                }
            } else {
                // 进入删除模式
                toggleDeleteMode();
                updateDeleteButtonState();
            }
        });
    }

    // 全选复选框事件
    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            handleSelectAll(this);
        });
    }

    // 行复选框事件（使用事件委托）
    const tableBody = document.querySelector('.production-table tbody');
    if (tableBody) {
        tableBody.addEventListener('change', function(event) {
            if (event.target.classList.contains('row-checkbox')) {
                handleRowSelection(event.target);
            }
        });

        // 行点击事件 - 在删除模式下点击整行切换复选框
        tableBody.addEventListener('click', function(event) {
            // 只在删除模式下响应行点击
            if (!isDeleteMode) return;
            
            // 如果点击的是复选框本身，不处理（避免重复触发）
            if (event.target.classList.contains('row-checkbox')) return;
            
            // 找到被点击的行
            const row = event.target.closest('tr');
            if (!row) return;
            
            // 找到该行的复选框
            const checkbox = row.querySelector('.row-checkbox');
            if (!checkbox) return;
            
            // 切换复选框状态
            checkbox.checked = !checkbox.checked;
            
            // 触发复选框的change事件来更新选择状态
            handleRowSelection(checkbox);
        });
    }

    // ESC键退出删除模式
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && isDeleteMode) {
            exitDeleteMode();
        }
    });

    /**
     * 从存储中加载所有订单数据并显示在表格中
     */
    function loadOrdersFromStorage() {
        if (!window.dataManager) {
            console.warn('数据管理器未初始化');
            return;
        }

        const orders = window.dataManager.getAllOrders();
        const tableBody = document.querySelector('.production-table tbody');
        
        // 清空现有的表格内容（保留表头）
        tableBody.innerHTML = '';
        
        // 按Priority排序订单
        orders.sort((a, b) => (a.priority || 9999) - (b.priority || 9999));
        
        // 加载每个订单到表格
        orders.forEach(order => {
            addOrderToTable(order, order.id);
        });
        
        // 重新排序Priority列以确保连续性
        reorderPriorityColumn();
        
        console.log(`已加载 ${orders.length} 个订单`);
    }

    // 页面加载时从存储中加载数据
    loadOrdersFromStorage();
});