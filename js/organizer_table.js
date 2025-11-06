// 获取并显示订单数据
function fetchAndDisplayOrders() {
    fetch('http://localhost:5000/api/orders')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                renderTable(data.data);
            } else {
                console.error("Error fetching orders:", data.message);
            }
        })
        .catch(error => {
            console.error('Error fetching or processing orders:', error);
        });
}

// 渲染表格数据
function renderTable(orders) {
    const tableBody = document.querySelector('.production-table tbody');
    if (!tableBody) return;

    tableBody.innerHTML = ''; // 清空现有数据

    orders.forEach(order => {
        // 根据状态映射到颜色样式类
        const statusText = (order.Status || '').toString();
        const statusKey = statusText.trim().toLowerCase();
        let statusClass = 'status-green';
        if (['delayed', 'overdue', 'error', 'failed'].includes(statusKey)) {
            statusClass = 'status-red';
        } else if (['pending', 'new', 'waiting'].includes(statusKey)) {
            statusClass = 'status-yellow';
        } else if (['active', 'running', 'completed', 'done'].includes(statusKey)) {
            statusClass = 'status-green';
        }

        // 通过前端计算订单进度
        const finished = Number(order.Pieces_finished) || 0;
        const intended = Number(order.Pieces_intended) || 0;
        const progressPercent = intended > 0
            ? Math.min(100, Math.max(0, Math.round((finished / intended) * 100)))
            : 0;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="col-checkbox"><input type="checkbox" class="row-checkbox"></td>
            <td>${order.Priority}</td>
            <td><span class="status-indicator ${statusClass}"></span> ${statusText}</td>
            <td>${order.Production_order}</td>
            <td>${order.Part_type}</td>
            <td>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercent}%;"></div>
                </div>
            </td>
            <td>${finished} / ${intended}</td>
            <td>${order.Delivery_date}</td>
            <td>${order.Scheduled_date}</td>
        `;
        tableBody.appendChild(row);
    });

    // 数据渲染完成后重新初始化复选框功能
    initTableCheckboxes();
}

// 表格复选框功能
function initTableCheckboxes() {
    const selectAllCheckbox = document.getElementById('selectAll');
    const rowCheckboxes = document.querySelectorAll('.row-checkbox');
    const tableRows = document.querySelectorAll('.production-table tbody tr');
    
    // 全选/取消全选功能
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            rowCheckboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
            updateRowSelection();
        });
    }
    
    // 单个复选框改变时检查是否需要更新全选状态
    rowCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateSelectAllState();
            updateRowSelection();
        });
    });
    
    // 点击整行选择/取消选择
    tableRows.forEach(row => {
        row.addEventListener('click', function(e) {
            // 如果点击的是复选框本身，不处理（避免重复触发）
            if (e.target.type === 'checkbox') {
                return;
            }
            
            const checkbox = this.querySelector('.row-checkbox');
            if (checkbox) {
                checkbox.checked = !checkbox.checked;
                updateSelectAllState();
                updateRowSelection();
            }
        });
    });
    
    // 更新全选状态
    function updateSelectAllState() {
        if (selectAllCheckbox) {
            const allChecked = Array.from(rowCheckboxes).every(cb => cb.checked);
            const someChecked = Array.from(rowCheckboxes).some(cb => cb.checked);
            
            selectAllCheckbox.checked = allChecked;
            selectAllCheckbox.indeterminate = someChecked && !allChecked;
        }
    }
    
    // 更新行选中状态（添加视觉反馈）
    function updateRowSelection() {
        tableRows.forEach(row => {
            const checkbox = row.querySelector('.row-checkbox');
            if (checkbox && checkbox.checked) {
                row.classList.add('row-selected');
            } else {
                row.classList.remove('row-selected');
            }
        });
    }
}

// 获取选中的行
function getSelectedRows() {
    const selectedRows = [];
    const rowCheckboxes = document.querySelectorAll('.row-checkbox:checked');
    
    rowCheckboxes.forEach(checkbox => {
        const row = checkbox.closest('tr');
        if (row) {
            selectedRows.push(row);
        }
    });
    
    return selectedRows;
}

// 初始化“建立新生产订单”模态框交互与提交
function initNewOrderModal() {
    const modal = document.getElementById('newOrderModal');
    const openBtn = document.querySelector('.btn.btn-create');
    const closeBtn = modal ? modal.querySelector('.close') : null;
    const cancelBtn = modal ? modal.querySelector('.btn-cancel') : null;
    const form = document.getElementById('newOrderForm');

    const showModal = () => {
        if (modal) modal.style.display = 'block';
    };

    const hideModal = () => {
        if (modal) modal.style.display = 'none';
        if (form) form.reset();
    };

    if (openBtn) {
        openBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showModal();
        });
    }

    if (closeBtn) closeBtn.addEventListener('click', hideModal);
    if (cancelBtn) cancelBtn.addEventListener('click', hideModal);

    // 点击模态框外区域关闭
    window.addEventListener('click', (e) => {
        if (e.target === modal) hideModal();
    });

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = form.querySelector('.btn-submit');
            if (submitBtn) submitBtn.disabled = true;

            // 获取表单值
            const priority = Number(document.getElementById('priority')?.value) || 9999;
            const productionOrder = document.getElementById('productionOrder')?.value?.trim() || '';
            const partType = document.getElementById('partType')?.value?.trim() || '';
            const plannedQuantity = Number(document.getElementById('plannedQuantity')?.value) || 0;
            const currentQuantity = Number(document.getElementById('currentQuantity')?.value) || 0;
            const deliveryDate = document.getElementById('deliveryDate')?.value || '';
            const scheduledDate = document.getElementById('scheduledDate')?.value || '';

            // 简单校验
            if (!productionOrder || !partType || plannedQuantity <= 0) {
                alert('请填写必填项，并确保计划件数大于 0');
                if (submitBtn) submitBtn.disabled = false;
                return;
            }

            // 组装后端期望的数据键
            const orderData = {
                Priority: priority,
                Status: 'New',
                Production_order: productionOrder,
                Part_type: partType,
                Pieces_finished: currentQuantity,
                Pieces_intended: plannedQuantity,
                Delivery_date: deliveryDate,
                Scheduled_date: scheduledDate,
            };

            try {
                const resp = await fetch('http://localhost:5000/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: orderData }),
                });

                const result = await resp.json().catch(() => ({}));
                if (!resp.ok || result.success === false) {
                    const msg = result.message || '创建订单失败';
                    throw new Error(msg);
                }

                // 成功：关闭模态框并刷新表格
                hideModal();
                fetchAndDisplayOrders();
            } catch (err) {
                console.error('创建订单错误:', err);
                alert(err.message || '网络错误或服务器异常');
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    fetchAndDisplayOrders();
    initNewOrderModal();
});