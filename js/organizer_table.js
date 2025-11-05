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
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="col-checkbox"><input type="checkbox" class="row-checkbox"></td>
            <td>${order.Priority}</td>
            <td><span class="status-indicator status-${order.Status.toLowerCase()}"></span> ${order.Status}</td>
            <td>${order.Production_order}</td>
            <td>${order.Part_type}</td>
            <td>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${order.Order_progress};"></div>
                    <span class="progress-text">${order.Pieces_finished}/${order.Pieces_intended}</span>
                </div>
            </td>
            <td>${order.Pieces_intended}</td>
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

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    fetchAndDisplayOrders();
});