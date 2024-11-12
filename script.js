// API配置
const API_KEY = '5340a3613a5108d411a92e8272265978.PV37BpNkp6dbpRTa'; // 智谱AI API密钥
const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'; // API端点

// 存储聊天历史记录的数组
let chatHistory = [];

// 在文件开头添加以下代码
window.addEventListener('error', function(event) {
    // 忽略扩展相关的连接错误
    if (event.message.includes('Could not establish connection')) {
        event.preventDefault(); // 阻止错误显示在控制台
    }
});

// 在文件开头定义语言配置
const translations = {
    zh: {
        'home': '首页',
        'ai-chat': 'AI聊天',
        'voice-clone': '音色克隆',
        'digital-talk': '数字对话',
        'site-title': '银龄之悦',
        'hero-subtitle': '智能科技，助力银龄生活',
        'start-ai-chat': '开始AI对话',
        'try-voice-clone': '体验声音克隆',
        'explore-digital-talk': '探索数字对话',
        'ai-chat-desc': '智能对话助手，随时为您解答疑惑',
        'voice-clone-desc': '保存珍贵声音，传承美好回忆',
        'digital-talk-desc': '创新交互体验，连接智慧生活',
        
        'chat-placeholder': '输入您想说的话...',
        'thinking': '正在思考...',
        'new-chat': '新建对话',
        'send': '发送',
        'welcome-title': '欢迎使用AI助手',
        'welcome-subtitle': '有什么可以帮您的吗？',
        
        'voice-title': '音色克隆',
        'voice-intro': '保存和复制您喜爱的声音',
        'start-recording': '开始录音',
        'stop-recording': '停止录音',
        'play-voice': '播放声音',
        'save-voice': '保存声音',
        
        'digital-title': '数字对话',
        'digital-intro': '与数字形象互动',
        'select-avatar': '选择形象',
        'start-interaction': '开始互动',
        'customize': '自定义设置'
    },
    en: {
        'home': 'Home',
        'ai-chat': 'AI Chat',
        'voice-clone': 'Voice Clone',
        'digital-talk': 'Digital Talk',
        'site-title': 'Silver Age Joy',
        'hero-subtitle': 'Smart Technology for Senior Living',
        'start-ai-chat': 'Start AI Chat',
        'try-voice-clone': 'Try Voice Clone',
        'explore-digital-talk': 'Explore Digital Talk',
        'ai-chat-desc': 'Smart conversation assistant, always ready to help',
        'voice-clone-desc': 'Preserve precious voices, inherit beautiful memories',
        'digital-talk-desc': 'Innovative interaction experience, connecting smart life',
        
        'chat-placeholder': 'Type your message...',
        'thinking': 'Thinking...',
        'new-chat': 'New Chat',
        'send': 'Send',
        'welcome-title': 'Welcome to AI Assistant',
        'welcome-subtitle': 'How can I help you today?',
        
        'voice-title': 'Voice Clone',
        'voice-intro': 'Save and replicate your favorite voices',
        'start-recording': 'Start Recording',
        'stop-recording': 'Stop Recording',
        'play-voice': 'Play Voice',
        'save-voice': 'Save Voice',
        
        'digital-title': 'Digital Talk',
        'digital-intro': 'Interact with digital characters',
        'select-avatar': 'Select Avatar',
        'start-interaction': 'Start Interaction',
        'customize': 'Customize Settings'
    }
};

/**
 * 创建消息元素
 * @param {string} content - 消息内容
 * @param {boolean} isUser - 是否为用户消息
 * @returns {HTMLElement} 消息元素
 */
function createMessageElement(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
    
    // 格式化内容，支持代码块和基础markdown
    const formattedContent = formatContent(content);
    
    messageDiv.innerHTML = `
        <div class="message-content">
            <div class="message-text">${formattedContent}</div>
        </div>
    `;
    return messageDiv;
}

/**
 * 格式化消息内容，支持Markdown语法
 * @param {string} content - 原始消息内容
 * @returns {string} 格式化后的HTML内容
 */
function formatContent(content) {
    // 处理代码块
    content = content.replace(/```([\s\S]*?)```/g, (match, code) => {
        return `<pre class="code-block"><code>${escapeHtml(code.trim())}</code></pre>`;
    });
    
    // 处理行内代码
    content = content.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    
    // 处理标题
    content = content.replace(/^(#{1,6})\s+(.+)$/gm, (match, hashes, title) => {
        const level = hashes.length;
        return `<h${level} class="markdown-title">${title}</h${level}>`;
    });
    
    // 处理有序列表
    content = content.replace(/^\d+\.\s+(.+)$/gm, '<li class="markdown-list-item">$1</li>');
    
    // 处理无序列表
    content = content.replace(/^[-*+]\s+(.+)$/gm, '<li class="markdown-list-item">$1</li>');
    
    // 处理引用
    content = content.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');
    
    // 处理粗体
    content = content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // 处理斜体
    content = content.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // 处理分隔线
    content = content.replace(/^---+$/gm, '<hr class="markdown-hr">');
    
    // 处理段落
    content = content.split('\n\n').map(para => {
        if (!para.trim()) return '';
        if (para.startsWith('<')) return para; // 已经是HTML标签的内容
        return `<p class="markdown-paragraph">${para.trim()}</p>`;
    }).join('\n');
    
    return content;
}

/**
 * HTML字符转义函数
 * @param {string} unsafe - 需要转义的字符串
 * @returns {string} 转义后的安全字符串
 */
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * 发送消息到智谱AI
 * @param {string} message - 用户消息
 * @returns {Promise<string>} AI响应内容
 */
async function sendToAI(message) {
    try {
        const messages = [
            ...chatHistory,
            { role: "user", content: message }
        ];

        const requestBody = {
            model: "glm-4",
            messages: messages,
            temperature: 0.7,
            request_id: crypto.randomUUID(),
            stream: false,
            top_p: 0.7,
            max_tokens: 2048
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('API Response:', data);

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Invalid response format from API');
        }

        const aiResponse = data.choices[0].message.content;
        
        // 更新聊天历史
        chatHistory.push(
            { role: 'user', content: message },
            { role: 'assistant', content: aiResponse }
        );

        return aiResponse;

    } catch (error) {
        console.error('Error in sendToAI:', error);
        throw error;
    }
}

/**
 * 添加消息到聊天界面
 * @param {string} content - 消息内容
 * @param {boolean} isUser - 是否用户消息
 */
function addMessageToChat(content, isUser = false) {
    // 隐藏欢迎屏幕
    const welcomeScreen = document.querySelector('.welcome-screen');
    if (welcomeScreen) {
        welcomeScreen.style.display = 'none';
    }

    // 创建或获取聊天消息容器
    const chatMessages = document.querySelector('.chat-messages') || createChatMessagesContainer();
    chatMessages.appendChild(createMessageElement(content, isUser));
    chatMessages.scrollTop = chatMessages.scrollHeight; // 自动滚动到底部
}

/**
 * 创建聊天消息容器
 * @returns {HTMLElement} 聊天消息容器元素
 */
function createChatMessagesContainer() {
    const chatMessages = document.createElement('div');
    chatMessages.className = 'chat-messages';
    document.querySelector('.chat-container').insertBefore(
        chatMessages,
        document.querySelector('.chat-input-container')
    );
    return chatMessages;
}

/**
 * 发送消息处理函数
 */
async function sendMessage() {
    const input = document.querySelector('.input-box input');
    const message = input.value.trim();
    
    if (!message) return;

    try {
        // 显示用户消息
        addMessageToChat(message, true);
        input.value = '';

        // 显示加载状态
        const loadingMessage = createMessageElement('正在思考...', false);
        const chatMessages = document.querySelector('.chat-messages');
        chatMessages.appendChild(loadingMessage);

        // 获取AI响应
        const aiResponse = await sendToAI(message);
        
        // 移除加载状态
        chatMessages.removeChild(loadingMessage);
        
        // 显示AI响应
        addMessageToChat(aiResponse, false);

    } catch (error) {
        console.error('Error:', error);
        const chatMessages = document.querySelector('.chat-messages');
        const loadingMessage = chatMessages.querySelector('.message:last-child');
        if (loadingMessage) {
            chatMessages.removeChild(loadingMessage);
        }
        addMessageToChat('抱歉，发生了错误，请稍后再试。', false);
    }
}

/**
 * 新建对话函
 * 清空聊天历史并重置界面
 */
function startNewChat() {
    chatHistory = [];
    const chatMessages = document.querySelector('.chat-messages');
    if (chatMessages) {
        chatMessages.innerHTML = '';
    }
    const welcomeScreen = document.querySelector('.welcome-screen');
    if (welcomeScreen) {
        welcomeScreen.style.display = 'flex';
    }
}

// 语言切换功能
function initLanguageSelector() {
    const languageDropdown = document.querySelector('.language-dropdown');
    const languageBtn = document.querySelector('.language-btn');
    
    if (!languageDropdown || !languageBtn) {
        console.error('Language selector elements not found');
        return;
    }

    // 点击语言选项
    languageDropdown.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
            e.preventDefault();
            const selectedLang = e.target.getAttribute('data-lang');
            console.log('Selected language:', selectedLang); // 调试日志
            switchLanguage(selectedLang);
        }
    });

    // 显示/隐藏下拉菜单
    languageBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = languageDropdown.style.display === 'block';
        languageDropdown.style.display = isVisible ? 'none' : 'block';
    });

    // 点击其他地方时隐藏下拉菜单
    document.addEventListener('click', () => {
        languageDropdown.style.display = 'none';
    });
}

function switchLanguage(lang) {
    console.log('Switching language to:', lang); // 调试日志
    
    // 遍历所有需要翻译的元素
    document.querySelectorAll('[data-lang]').forEach(element => {
        const key = element.getAttribute('data-lang');
        console.log('Translating element:', key); // 调试日志
        
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });

    // 更新当前语言显示
    const currentLangSpan = document.querySelector('.current-lang');
    if (currentLangSpan) {
        currentLangSpan.textContent = lang === 'zh' ? '简体中文' : 'English';
    }

    // 更新语言选项的激活状态
    document.querySelectorAll('.language-dropdown a').forEach(link => {
        link.classList.toggle('active', link.getAttribute('data-lang') === lang);
    });

    // 保存语言偏好
    localStorage.setItem('preferred-language', lang);
}

// 当 DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing language selector...'); // 调试日志
    initLanguageSelector();
    
    // 应用保存的语言偏好
    const savedLang = localStorage.getItem('preferred-language');
    if (savedLang) {
        switchLanguage(savedLang);
    }
    
    // 绑定发送消息和新建对话的事件处理
    const sendButton = document.querySelector('.send-btn');
    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }
    
    const newChatButton = document.querySelector('.new-chat-btn');
    if (newChatButton) {
        newChatButton.addEventListener('click', startNewChat);
    }
    
    // 绑定输入框回车事件
    const inputBox = document.querySelector('.input-box input');
    if (inputBox) {
        inputBox.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
}); 