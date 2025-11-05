// 显示当前时间函数
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    
    const timeElement = document.getElementById('currentTime');
    if (timeElement) {
        timeElement.textContent = timeString;
    }
}

// 页面加载时更新时间
updateTime();

// 每秒更新一次时间
setInterval(updateTime, 1000);