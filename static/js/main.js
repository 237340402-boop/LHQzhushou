// 全局变量
let chatHistory = JSON.parse(localStorage.getItem('linghuaqian-chat')) || [];

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 1. 导航切换逻辑
    initNav();
    // 2. 对话功能初始化
    initChat();
    // 3. 数据图表初始化
    initCharts();
    // 4. 内容创作功能初始化
    initContentCreation();
    // 5. 图片生成功能初始化
    initImageGeneration();
    // 6. 加载历史对话
    loadChatHistory();
});

// 1. 导航切换
function initNav() {
    // 桌面导航
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('data-target');
            navigateTo(target);
        });
    });
    // 移动端导航
    const mobileNavToggle = document.getElementById('mobile-nav-toggle');
    const mobileNavClose = document.getElementById('mobile-nav-close');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
    const mobileNav = document.getElementById('mobile-nav');

    mobileNavToggle.addEventListener('click', function() {
        mobileNav.classList.add('show');
    });
    mobileNavClose.addEventListener('click', function() {
        mobileNav.classList.remove('show');
    });
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('data-target');
            navigateTo(target);
            mobileNav.classList.remove('show');
        });
    });
}

// 页面切换函数
function navigateTo(targetId) {
    // 隐藏所有页面
    const sections = document.querySelectorAll('.page-section');
    sections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    // 显示目标页面
    const targetSection = document.getElementById(targetId);
    targetSection.classList.add('active');
    targetSection.style.display = 'block';
    // 更新导航激活状态
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-target') === targetId) {
            link.classList.add('active');
        }
    });
    // 滚动到顶部
    window.scrollTo(0, 0);
}

// 2. 对话功能核心逻辑（含安全防护）
function initChat() {
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-msg');
    const clearChatBtn = document.getElementById('clear-chat');
    const quickReplies = document.querySelectorAll('.quick-reply');

    // 发送消息
    sendBtn.addEventListener('click', sendMessage);
    // 回车发送（排除shift+回车）
    chatInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    // 清空对话
    clearChatBtn.addEventListener('click', clearChat);
    // 快捷回复
    quickReplies.forEach(reply => {
        reply.addEventListener('click', function() {
            chatInput.value = this.textContent;
            sendMessage();
        });
    });
}

// 发送消息（含XSS防护+输入验证）
function sendMessage() {
    const chatInput = document.getElementById('chat-input');
    const chatContainer = document.getElementById('chat-container');
    let message = chatInput.value.trim();

    // 输入验证
    if (!message) {
        alert('请输入您的问题/需求！');
        return;
    }

    // XSS防护：转义特殊字符
    message = escapeHtml(message);

    // 禁用发送按钮，防止重复提交
    document.getElementById('send-msg').disabled = true;

    // 1. 添加用户消息到界面
    addMessageToUI('user', message);
    // 2. 保存到历史记录
    saveMessageToHistory('user', message);
    // 3. 清空输入框
    chatInput.value = '';

    // 4. 模拟AI回复（可替换为真实API调用）
    setTimeout(() => {
        let aiReply = getAIReply(message);
        // 添加AI回复到界面
        addMessageToUI('ai', aiReply);
        // 保存AI回复到历史记录
        saveMessageToHistory('ai', aiReply);
        // 启用发送按钮
        document.getElementById('send-msg').disabled = false;
    }, 800); // 模拟网络延迟
}

// XSS防护：转义HTML特殊字符
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// 添加消息到界面
function addMessageToUI(role, content) {
    const chatContainer = document.getElementById('chat-container');
    const msgDiv = document.createElement('div');
    msgDiv.className = `flex mb-4 ${role === 'user' ? 'user-msg' : 'ai-msg'}`;

    let avatar = '';
    if (role === 'user') {
        avatar = `<div class="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 ml-3"><i class="fa fa-user text-gray-600 text-sm"></i></div>`;
        msgDiv.innerHTML = `
            <div class="msg-content rounded-lg p-3 max-w-[80%]">
                <p>${content}</p>
            </div>
            ${avatar}
        `;
    } else {
        avatar = `<div class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mr-3"><i class="fa fa-robot text-red-600 text-sm"></i></div>`;
        msgDiv.innerHTML = `
            ${avatar}
            <div class="msg-content rounded-lg p-3 max-w-[80%]">
                <p>${content}</p>
            </div>
        `;
    }

    chatContainer.appendChild(msgDiv);
    // 滚动到底部
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// 保存消息到本地存储
function saveMessageToHistory(role, content) {
    const msgObj = {
        role: role,
        content: content,
        time: new Date().toISOString()
    };
    chatHistory.push(msgObj);
    // 限制历史记录长度（最多100条，防止存储溢出）
    if (chatHistory.length > 100) {
        chatHistory.shift();
    }
    // 保存到localStorage
    localStorage.setItem('linghuaqian-chat', JSON.stringify(chatHistory));
}

// 加载历史对话
function loadChatHistory() {
    const chatContainer = document.getElementById('chat-container');
    // 清空现有内容（保留欢迎语）
    chatContainer.innerHTML = `
        <div class="flex mb-4">
            <div class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mr-3"><i class="fa fa-robot text-red-600 text-sm"></i></div>
            <div class="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                <p class="text-gray-800">您好！我是零花黔全能助手，有什么可以帮助您的吗？</p>
            </div>
        </div>
    `;
    // 加载历史消息
    chatHistory.forEach(msg => {
        addMessageToUI(msg.role, msg.content);
    });
}

// 清空对话
function clearChat() {
    if (confirm('确定要清空所有对话记录吗？')) {
        chatHistory = [];
        localStorage.removeItem('linghuaqian-chat');
        loadChatHistory();
    }
}

// AI回复生成（模拟真实对话逻辑，可替换为API调用）
function getAIReply(userInput) {
    // 关键词匹配回复（示例，可扩展）
    const lowerInput = userInput.toLowerCase();
    if (lowerInput.includes('洗车') && lowerInput.includes('营销')) {
        return '自助洗车店营销建议：\n1. 推出9.9元体验套餐，吸引首次到店；\n2. 建立会员体系，充值送次数/礼品；\n3. 本地抖音/视频号发布洗车教程，引流到店；\n4. 与周边小区/加油站合作，互相导流。';
    } else if (lowerInput.includes('数据') || lowerInput.includes('分析')) {
        return '洗车行业核心数据：\n1. 自助洗车单店日均客流量约50-80辆；\n2. 客单价集中在10-20元；\n3. 周末客流量是工作日的1.5-2倍；\n4. 25-40岁车主是核心消费群体。';
    } else if (lowerInput.includes('文案') || lowerInput.includes('创作')) {
        return '【洗车店引流文案】\n标题：9.9元洗干净爱车！再也不用等1小时排队了\n内容：家门口的自助洗车店，随到随洗，高压水枪+泡沫+吸尘一站式搞定，省钱又省心！现在到店还送玻璃水~';
    } else {
        return `您的问题是：「${userInput}」\n\n这是智能回复示例，您可以基于实际需求扩展此功能，对接真实AI API即可实现更精准的回复。`;
    }
}

// 3. 数据图表初始化
function initCharts() {
    if (document.getElementById('sales-chart')) {
        const ctx = document.getElementById('sales-chart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
                datasets: [{
                    label: '洗车店月营收（元）',
                    data: [12000, 15000, 18000, 16500, 21000, 24000],
                    borderColor: '#DC2626',
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                }
            }
        });
    }
}

// 4. 内容创作功能
function initContentCreation() {
    const generateBtn = document.getElementById('generate-copy');
    if (generateBtn) {
        generateBtn.addEventListener('click', function() {
            const theme = document.getElementById('copy-theme').value.trim();
            if (!theme) {
                alert('请输入创作主题！');
                return;
            }
            // 显示结果
            document.getElementById('copy-result').classList.remove('hidden');
            document.getElementById('copy-content').textContent = `【${theme}】\n1. 标题：${theme}这样做，效果提升80%\n2. 内容：结合本地流量特点，${theme}的核心是抓住用户痛点，用低价体验吸引到店，用会员锁客长期消费。\n3. 结尾：点击评论区链接，领取专属优惠！`;
        });
    }
}

// 5. 图片生成功能
function initImageGeneration() {
    const generateBtn = document.getElementById('generate-image');
    if (generateBtn) {
        generateBtn.addEventListener('click', function() {
            const desc = document.getElementById('image-desc').value.trim();
            if (!desc) {
                alert('请输入图片描述！');
                return;
            }
            // 显示结果
            document.getElementById('image-result').classList.remove('hidden');
        });
    }
}