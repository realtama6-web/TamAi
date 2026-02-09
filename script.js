/* ========================================
   TAMAI v3 - COMPLETE VANILLA JAVASCRIPT
   ======================================== */

/* ========================================
   CONSTANTS & CONFIGURATION
   ======================================== */

// API Configuration
const OPENROUTER_API_KEY = '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';
const OPENROUTER_API_URL = 'https://openrouter.io/api/v1/chat/completions';

// SMTP Simulation Configuration (Frontend Logic)
const SMTP_CONFIG = {
    email: 'tamaidev.id@gmail.com',
    appPassword: 'lehu vofk wrqp rgnp'
};

// Storage Keys
const STORAGE_KEYS = {
    USER_DATA: 'tamai_user_data',
    IS_LOGGED_IN: 'tamai_is_logged_in',
    CHATS: 'tamai_chats',
    CURRENT_CHAT_ID: 'tamai_current_chat_id'
};

// OTP Configuration
const OTP_LENGTH = 6;
const OTP_TIMEOUT = 300; // 5 menit dalam detik

/* ========================================
   APPLICATION STATE
   ======================================== */

let appState = {
    isLoggedIn: false,
    currentUser: null,
    currentChatId: null,
    chats: {},
    sidebarOpen: true,
    profileMenuOpen: false
};

/* ========================================
   DOM ELEMENTS CACHE
   ======================================== */

const DOM = {
    // Auth Modal Elements
    authModal: document.getElementById('authModal'),
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    otpForm: document.getElementById('otpForm'),
    profilePicForm: document.getElementById('profilePicForm'),

    // Form Elements
    loginFormElement: document.getElementById('loginFormElement'),
    registerFormElement: document.getElementById('registerFormElement'),
    otpFormElement: document.getElementById('otpFormElement'),
    profilePicFormElement: document.getElementById('profilePicFormElement'),

    // Input Fields
    loginEmail: document.getElementById('loginEmail'),
    loginPassword: document.getElementById('loginPassword'),
    registerUsername: document.getElementById('registerUsername'),
    registerDisplayName: document.getElementById('registerDisplayName'),
    registerEmail: document.getElementById('registerEmail'),
    registerPassword: document.getElementById('registerPassword'),
    otpCode: document.getElementById('otpCode'),
    messageInput: document.getElementById('messageInput'),
    fileInput: document.getElementById('fileInput'),

    // Main App Elements
    mainApp: document.getElementById('mainApp'),
    sidebar: document.getElementById('sidebar'),
    sidebarToggleClose: document.getElementById('sidebarToggleClose'),
    newChatBtn: document.getElementById('newChatBtn'),
    chatListContainer: document.getElementById('chatListContainer'),
    messagesContainer: document.getElementById('messagesContainer'),
    welcomeMessage: document.getElementById('welcomeMessage'),

    // Buttons
    sendBtn: document.getElementById('sendBtn'),
    attachBtn: document.getElementById('attachBtn'),
    resendOtpBtn: document.getElementById('resendOtpBtn'),
    profileMenuBtn: document.getElementById('profileMenuBtn'),
    profileSection: document.getElementById('profileSection'),
    settingsBtn: document.getElementById('settingsBtn'),
    logoutBtn: document.getElementById('logoutBtn'),

    // Profile Elements
    profileMenu: document.getElementById('profileMenu'),
    profileAvatar: document.getElementById('profileAvatar'),
    profileAvatarImg: document.getElementById('profileAvatarImg'),
    profileDisplayName: document.getElementById('profileDisplayName'),
    profileUsername: document.getElementById('profileUsername'),

    // Profile Picture Form
    profilePicInput: document.getElementById('profilePicInput'),
    profilePicPreview: document.getElementById('profilePicPreview'),
    profilePicFileName: document.getElementById('profilePicFileName'),

    // Attachment Elements
    attachmentPreview: document.getElementById('attachmentPreview'),
    attachmentItems: document.getElementById('attachmentItems'),
    clearAttachmentsBtn: document.getElementById('clearAttachmentsBtn'),

    // OTP Elements
    otpEmailDisplay: document.getElementById('otpEmailDisplay'),

    // Settings Modal
    settingsModal: document.getElementById('settingsModal'),
    closeSettingsModal: document.getElementById('closeSettingsModal'),
    settingsUsername: document.getElementById('settingsUsername'),
    settingsDisplayName: document.getElementById('settingsDisplayName'),
    settingsEmail: document.getElementById('settingsEmail'),

    // Loading Spinner
    loadingSpinner: document.getElementById('loadingSpinner')
};

/* ========================================
   INITIALIZATION & EVENT LISTENERS
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    checkAuthStatus();
});

function initializeApp() {
    loadUserDataFromStorage();
    
    if (appState.isLoggedIn) {
        showMainApp();
        loadChatsFromStorage();
    } else {
        showAuthModal();
    }
}

function setupEventListeners() {
    // Auth Form Events
    DOM.loginFormElement.addEventListener('submit', handleLogin);
    DOM.registerFormElement.addEventListener('submit', handleRegister);
    DOM.otpFormElement.addEventListener('submit', handleOTPVerification);
    DOM.profilePicFormElement.addEventListener('submit', handleProfilePicUpload);

    // Chat Events
    DOM.newChatBtn.addEventListener('click', createNewChat);
    DOM.sendBtn.addEventListener('click', sendMessage);
    DOM.messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    DOM.messageInput.addEventListener('input', adjustTextareaHeight);

    // Attachment Events
    DOM.attachBtn.addEventListener('click', () => DOM.fileInput.click());
    DOM.fileInput.addEventListener('change', handleFileSelection);
    DOM.clearAttachmentsBtn.addEventListener('click', clearAttachments);

    // Profile Menu Events
    DOM.profileMenuBtn.addEventListener('click', toggleProfileMenu);
    DOM.profileSection.addEventListener('click', (e) => {
        if (!e.target.closest('.profile-menu-btn')) {
            // Click on profile section (not menu button)
        }
    });
    DOM.settingsBtn.addEventListener('click', openSettings);
    DOM.logoutBtn.addEventListener('click', handleLogout);
    DOM.closeSettingsModal.addEventListener('click', closeSettings);

    // Sidebar Toggle Events
    DOM.sidebarToggleClose.addEventListener('click', toggleSidebar);

    // OTP Resend
    DOM.resendOtpBtn.addEventListener('click', resendOTP);

    // Profile Picture Upload
    DOM.profilePicInput.addEventListener('change', handleProfilePicPreview);

    // Close profile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.profile-section') && !e.target.closest('.profile-menu')) {
            DOM.profileMenu.classList.add('hidden');
            appState.profileMenuOpen = false;
        }
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            const sidebarArea = e.target.closest('.sidebar') || e.target.closest('.sidebar-toggle-mobile');
            const mainContent = e.target.closest('.main-content');
            
            if (mainContent && appState.sidebarOpen) {
                DOM.sidebar.classList.remove('active');
                appState.sidebarOpen = false;
            }
        }
    });

    // Responsive sidebar on resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            DOM.sidebar.classList.remove('active');
            appState.sidebarOpen = true;
        }
    });

    // Close settings modal when clicking outside
    DOM.settingsModal.addEventListener('click', (e) => {
        if (e.target === DOM.settingsModal) {
            closeSettings();
        }
    });
}

/* ========================================
   AUTHENTICATION FUNCTIONS
   ======================================== */

function switchAuthForm(formId) {
    // Hide all forms
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    
    // Show selected form
    document.getElementById(formId).classList.add('active');
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = DOM.loginEmail.value.trim();
    const password = DOM.loginPassword.value.trim();
    
    if (!email || !password) {
        alert('Username dan Password harus diisi');
        return;
    }
    
    // Simulate login (any email/password works)
    // In production, this would call a backend API
    const users = getAllUsersFromStorage();
    const user = users.find(u => u.email === email || u.username === email);
    
    if (user && user.password === password) {
        appState.currentUser = user;
        appState.isLoggedIn = true;
        saveUserDataToStorage(user);
        showMainApp();
        loadChatsFromStorage();
        resetAuthForms();
    } else {
        alert('Email/Username atau Password salah. Coba daftar terlebih dahulu!');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const username = DOM.registerUsername.value.trim();
    const displayName = DOM.registerDisplayName.value.trim();
    const email = DOM.registerEmail.value.trim();
    const password = DOM.registerPassword.value.trim();
    
    if (!username || !displayName || !email || !password) {
        alert('Semua field harus diisi');
        return;
    }
    
    if (password.length < 6) {
        alert('Password minimal 6 karakter');
        return;
    }
    
    // Check if user already exists
    const users = getAllUsersFromStorage();
    if (users.some(u => u.email === email || u.username === username)) {
        alert('Email atau Username sudah terdaftar');
        return;
    }
    
    // Proceed to OTP verification
    const tempUser = {
        username,
        displayName,
        email,
        password
    };
    
    sessionStorage.setItem('tamai_temp_user', JSON.stringify(tempUser));
    generateAndSendOTP(email);
    
    switchAuthForm('otpForm');
    DOM.otpEmailDisplay.textContent = `Kode OTP telah dikirim ke ${email}`;
}

async function generateAndSendOTP(email) {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in session storage with timestamp
    sessionStorage.setItem('tamai_otp', otp);
    sessionStorage.setItem('tamai_otp_timestamp', Date.now().toString());
    
    // In production, this would call SMTP service
    // For now, we'll log it and show it in console
    console.log(`[OTP Simulation] Email: ${email}`);
    console.log(`[OTP Simulation] Code: ${otp}`);
    console.log(`[SMTP Config] Email: ${SMTP_CONFIG.email}`);
    console.log(`[SMTP Config] App Password: ${SMTP_CONFIG.appPassword}`);
    console.log('Untuk demo, gunakan kode OTP yang ditampilkan di console');
    
    // Show a helpful message to user
    setTimeout(() => {
        alert(`Demo Mode: Gunakan kode OTP dari console untuk verifikasi\n\nKode OTP: ${otp}`);
    }, 500);
}

async function handleOTPVerification(e) {
    e.preventDefault();
    
    const enteredOTP = DOM.otpCode.value.trim();
    const storedOTP = sessionStorage.getItem('tamai_otp');
    const otpTimestamp = parseInt(sessionStorage.getItem('tamai_otp_timestamp'));
    
    if (!enteredOTP || enteredOTP.length !== OTP_LENGTH) {
        alert('OTP harus 6 digit');
        return;
    }
    
    if (enteredOTP !== storedOTP) {
        alert('OTP salah');
        return;
    }
    
    // Check OTP timeout (5 menit)
    const currentTime = Date.now();
    if ((currentTime - otpTimestamp) > (OTP_TIMEOUT * 1000)) {
        alert('OTP sudah kadaluarsa. Silakan request OTP baru');
        return;
    }
    
    // OTP verified, proceed to profile picture upload
    const tempUser = JSON.parse(sessionStorage.getItem('tamai_temp_user'));
    sessionStorage.setItem('tamai_verified_user', JSON.stringify(tempUser));
    
    // Clear OTP data
    sessionStorage.removeItem('tamai_otp');
    sessionStorage.removeItem('tamai_otp_timestamp');
    sessionStorage.removeItem('tamai_temp_user');
    sessionStorage.removeItem('tamai_otp_retry_count');
    
    switchAuthForm('profilePicForm');
    DOM.otpCode.value = '';
}

function resendOTP() {
    const tempUser = JSON.parse(sessionStorage.getItem('tamai_temp_user'));
    if (tempUser) {
        generateAndSendOTP(tempUser.email);
    }
}

async function handleProfilePicUpload(e) {
    e.preventDefault();
    
    const fileInput = DOM.profilePicInput;
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Silakan pilih foto profil');
        return;
    }
    
    // Convert file to Base64
    const reader = new FileReader();
    reader.onload = (event) => {
        const base64Image = event.target.result;
        const verifiedUser = JSON.parse(sessionStorage.getItem('tamai_verified_user'));
        
        // Add profile picture to user data
        verifiedUser.profilePic = base64Image;
        
        // Save user to storage
        let users = getAllUsersFromStorage();
        users.push(verifiedUser);
        localStorage.setItem('tamai_all_users', JSON.stringify(users));
        
        // Log in the user
        appState.currentUser = verifiedUser;
        appState.isLoggedIn = true;
        saveUserDataToStorage(verifiedUser);
        
        // Clear session data
        sessionStorage.removeItem('tamai_verified_user');
        
        // Show main app
        showMainApp();
        loadChatsFromStorage();
        resetAuthForms();
    };
    
    reader.readAsDataURL(file);
}

function skipProfilePic() {
    const verifiedUser = JSON.parse(sessionStorage.getItem('tamai_verified_user'));
    
    // Set default avatar
    verifiedUser.profilePic = null;
    
    // Save user to storage
    let users = getAllUsersFromStorage();
    users.push(verifiedUser);
    localStorage.setItem('tamai_all_users', JSON.stringify(users));
    
    // Log in the user
    appState.currentUser = verifiedUser;
    appState.isLoggedIn = true;
    saveUserDataToStorage(verifiedUser);
    
    // Clear session data
    sessionStorage.removeItem('tamai_verified_user');
    
    // Show main app
    showMainApp();
    loadChatsFromStorage();
    resetAuthForms();
}

function handleProfilePicPreview(e) {
    const file = e.target.files[0];
    
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = document.createElement('img');
            img.src = event.target.result;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            
            DOM.profilePicPreview.innerHTML = '';
            DOM.profilePicPreview.appendChild(img);
            DOM.profilePicFileName.textContent = file.name;
        };
        
        reader.readAsDataURL(file);
    }
}

/* ========================================
   CHAT FUNCTIONS
   ======================================== */

function createNewChat() {
    const chatId = 'chat_' + Date.now();
    const newChat = {
        id: chatId,
        title: 'Chat Baru',
        createdAt: new Date().toISOString(),
        messages: []
    };
    
    appState.chats[chatId] = newChat;
    appState.currentChatId = chatId;
    
    saveChatsToStorage();
    renderChatList();
    clearMessages();
    
    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        DOM.sidebar.classList.remove('active');
        appState.sidebarOpen = false;
    }
}

function selectChat(chatId) {
    appState.currentChatId = chatId;
    localStorage.setItem(STORAGE_KEYS.CURRENT_CHAT_ID, chatId);
    renderChatList();
    renderMessages();
    
    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        DOM.sidebar.classList.remove('active');
        appState.sidebarOpen = false;
    }
}

function deleteChat(chatId, e) {
    e.stopPropagation();
    
    if (confirm('Yakin ingin menghapus chat ini?')) {
        delete appState.chats[chatId];
        
        if (appState.currentChatId === chatId) {
            const chatIds = Object.keys(appState.chats);
            appState.currentChatId = chatIds.length > 0 ? chatIds[0] : null;
        }
        
        saveChatsToStorage();
        renderChatList();
        
        if (appState.currentChatId) {
            renderMessages();
        } else {
            clearMessages();
        }
    }
}

async function sendMessage() {
    const message = DOM.messageInput.value.trim();
    const attachments = getAttachmentsList();
    
    if (!message && attachments.length === 0) {
        return;
    }
    
    if (!appState.currentChatId) {
        createNewChat();
    }
    
    const currentChat = appState.chats[appState.currentChatId];
    if (!currentChat) {
        return;
    }
    
    // Add user message
    const userMessage = {
        id: 'msg_' + Date.now(),
        type: 'user',
        content: message,
        attachments: attachments,
        timestamp: new Date().toISOString()
    };
    
    currentChat.messages.push(userMessage);
    
    // Auto-title: Update chat title with first message
    if (currentChat.messages.length === 1 && message) {
        const titleText = message.substring(0, 50) + (message.length > 50 ? '...' : '');
        currentChat.title = titleText;
    }
    
    renderMessages();
    saveChatsToStorage();
    
    // Clear input and attachments
    DOM.messageInput.value = '';
    DOM.messageInput.style.height = 'auto';
    clearAttachments();
    
    // Show loading
    showLoading();
    
    // Get AI response
    try {
        const aiResponse = await getAIResponse(message, currentChat.messages);
        
        const assistantMessage = {
            id: 'msg_' + Date.now(),
            type: 'assistant',
            content: aiResponse,
            timestamp: new Date().toISOString()
        };
        
        currentChat.messages.push(assistantMessage);
        saveChatsToStorage();
        renderMessages();
    } catch (error) {
        console.error('Error getting AI response:', error);
        
        const errorMessage = {
            id: 'msg_' + Date.now(),
            type: 'assistant',
            content: 'Maaf, terjadi kesalahan saat menghubungi AI. Silakan coba lagi.',
            timestamp: new Date().toISOString()
        };
        
        currentChat.messages.push(errorMessage);
        saveChatsToStorage();
        renderMessages();
    } finally {
        hideLoading();
    }
}

async function getAIResponse(userMessage, messageHistory) {
    // Build conversation context
    const messages = messageHistory.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
    }));
    
    const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.href,
            'X-Title': 'TamAi v3'
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: messages,
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: 2000
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API request failed');
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
}

function renderMessages() {
    if (!appState.currentChatId) {
        DOM.messagesContainer.innerHTML = DOM.welcomeMessage.outerHTML;
        return;
    }
    
    const currentChat = appState.chats[appState.currentChatId];
    if (!currentChat) {
        DOM.messagesContainer.innerHTML = DOM.welcomeMessage.outerHTML;
        return;
    }
    
    if (currentChat.messages.length === 0) {
        DOM.messagesContainer.innerHTML = DOM.welcomeMessage.outerHTML;
        return;
    }
    
    DOM.messagesContainer.innerHTML = '';
    
    currentChat.messages.forEach(msg => {
        const messageEl = createMessageElement(msg);
        DOM.messagesContainer.appendChild(messageEl);
    });
    
    // Scroll to bottom
    DOM.messagesContainer.scrollTop = DOM.messagesContainer.scrollHeight;
    
    // Add copy button functionality to all code blocks
    setTimeout(() => {
        addCopyButtonsToCodeBlocks();
    }, 100);
}

function createMessageElement(msg) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${msg.type}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // Parse content as HTML if it contains markdown-like formatting
    contentDiv.innerHTML = formatMessageContent(msg.content);
    
    // Add attachments if any
    if (msg.attachments && msg.attachments.length > 0) {
        const attachmentsDiv = document.createElement('div');
        attachmentsDiv.className = 'message-attachments';
        attachmentsDiv.style.marginTop = '12px';
        
        msg.attachments.forEach(att => {
            const attEl = document.createElement('div');
            attEl.className = 'message-attachment-item';
            attEl.style.cssText = 'padding: 8px; background: rgba(0,0,0,0.2); border-radius: 6px; margin-top: 8px; font-size: 12px;';
            
            if (att.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = att.data;
                img.style.cssText = 'max-width: 200px; max-height: 200px; border-radius: 4px; margin-top: 8px;';
                attEl.appendChild(img);
            }
            
            const nameEl = document.createElement('div');
            nameEl.textContent = att.name;
            attEl.appendChild(nameEl);
            
            attachmentsDiv.appendChild(attEl);
        });
        
        contentDiv.appendChild(attachmentsDiv);
    }
    
    messageDiv.appendChild(contentDiv);
    return messageDiv;
}

function formatMessageContent(content) {
    // Handle code blocks
    let formatted = content.replace(
        /```(\w+)?\n([\s\S]*?)```/g,
        (match, language, code) => {
            const lang = language || 'javascript';
            const escapedCode = escapeHtml(code.trim());
            return `<pre><code>${escapedCode}</code></pre>`;
        }
    );
    
    // Handle inline code
    formatted = formatted.replace(
        /`([^`]+)`/g,
        '<code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 3px; font-family: monospace;">$1</code>'
    );
    
    // Handle bold
    formatted = formatted.replace(
        /\*\*(.+?)\*\*/g,
        '<strong>$1</strong>'
    );
    
    // Handle italic
    formatted = formatted.replace(
        /\*(.+?)\*/g,
        '<em>$1</em>'
    );
    
    // Handle links
    formatted = formatted.replace(
        /\[(.+?)\]\((.+?)\)/g,
        '<a href="$2" target="_blank">$1</a>'
    );
    
    // Handle line breaks
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function addCopyButtonsToCodeBlocks() {
    const codeBlocks = document.querySelectorAll('.message-content pre');
    
    codeBlocks.forEach(block => {
        // Check if button already exists
        if (block.querySelector('.copy-code-btn')) {
            return;
        }
        
        const button = document.createElement('button');
        button.className = 'copy-code-btn';
        button.textContent = 'Copy';
        button.type = 'button';
        
        button.addEventListener('click', () => {
            const code = block.querySelector('code').textContent;
            navigator.clipboard.writeText(code).then(() => {
                button.classList.add('copied');
                button.textContent = 'Copied!';
                
                setTimeout(() => {
                    button.classList.remove('copied');
                    button.textContent = 'Copy';
                }, 2000);
            });
        });
        
        block.style.position = 'relative';
        block.appendChild(button);
    });
}

function clearMessages() {
    DOM.messagesContainer.innerHTML = DOM.welcomeMessage.outerHTML;
    appState.currentChatId = null;
}

function renderChatList() {
    DOM.chatListContainer.innerHTML = '';
    
    const chatIds = Object.keys(appState.chats).reverse();
    
    if (chatIds.length === 0) {
        DOM.chatListContainer.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 13px;">Belum ada chat</div>';
        return;
    }
    
    chatIds.forEach(chatId => {
        const chat = appState.chats[chatId];
        const chatItem = document.createElement('button');
        chatItem.className = `chat-item ${appState.currentChatId === chatId ? 'active' : ''}`;
        
        const titleSpan = document.createElement('span');
        titleSpan.className = 'chat-item-title';
        titleSpan.textContent = chat.title;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'chat-item-delete';
        deleteBtn.type = 'button';
        deleteBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
        deleteBtn.addEventListener('click', (e) => deleteChat(chatId, e));
        
        chatItem.appendChild(titleSpan);
        chatItem.appendChild(deleteBtn);
        chatItem.addEventListener('click', () => selectChat(chatId));
        
        DOM.chatListContainer.appendChild(chatItem);
    });
}

/* ========================================
   ATTACHMENT FUNCTIONS
   ======================================== */

function handleFileSelection(e) {
    const files = e.target.files;
    
    if (files.length === 0) return;
    
    Array.from(files).forEach(file => {
        addAttachment(file);
    });
    
    // Reset file input
    DOM.fileInput.value = '';
}

function addAttachment(file) {
    const attachmentsList = getAttachmentsList();
    
    // Limit to 5 attachments
    if (attachmentsList.length >= 5) {
        alert('Maksimal 5 lampiran per pesan');
        return;
    }
    
    // Check file size (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
        alert('Ukuran file terlalu besar (max 25MB)');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const attachment = {
            id: 'att_' + Date.now(),
            name: file.name,
            type: file.type,
            size: file.size,
            data: event.target.result
        };
        
        // Store in a temporary variable
        if (!window.tamai_attachments) {
            window.tamai_attachments = [];
        }
        window.tamai_attachments.push(attachment);
        
        renderAttachmentPreview();
    };
    
    reader.readAsDataURL(file);
}

function renderAttachmentPreview() {
    const attachments = getAttachmentsList();
    
    if (attachments.length === 0) {
        DOM.attachmentPreview.classList.add('hidden');
        return;
    }
    
    DOM.attachmentPreview.classList.remove('hidden');
    DOM.attachmentItems.innerHTML = '';
    
    attachments.forEach(att => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'attachment-item';
        
        // Create thumbnail or icon
        const thumbDiv = document.createElement('div');
        thumbDiv.className = 'attachment-item-thumbnail';
        
        if (att.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = att.data;
            thumbDiv.appendChild(img);
        } else if (att.type.startsWith('video/')) {
            const video = document.createElement('video');
            video.src = att.data;
            thumbDiv.appendChild(video);
        } else {
            const iconDiv = document.createElement('div');
            iconDiv.className = 'attachment-item-icon';
            iconDiv.innerHTML = getFileIcon(att.type);
            thumbDiv.appendChild(iconDiv);
        }
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'attachment-item-name';
        nameDiv.textContent = att.name;
        nameDiv.title = att.name;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'attachment-item-remove';
        removeBtn.type = 'button';
        removeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
        removeBtn.addEventListener('click', () => removeAttachment(att.id));
        
        itemDiv.appendChild(thumbDiv);
        itemDiv.appendChild(nameDiv);
        itemDiv.appendChild(removeBtn);
        
        DOM.attachmentItems.appendChild(itemDiv);
    });
}

function getFileIcon(fileType) {
    if (fileType.startsWith('application/pdf')) {
        return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>';
    } else if (fileType.startsWith('application/') || fileType.startsWith('text/')) {
        return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>';
    } else {
        return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>';
    }
}

function removeAttachment(attId) {
    window.tamai_attachments = getAttachmentsList().filter(a => a.id !== attId);
    renderAttachmentPreview();
}

function clearAttachments() {
    window.tamai_attachments = [];
    DOM.attachmentPreview.classList.add('hidden');
    DOM.attachmentItems.innerHTML = '';
}

function getAttachmentsList() {
    return window.tamai_attachments || [];
}

/* ========================================
   UI FUNCTIONS
   ======================================== */

function adjustTextareaHeight() {
    DOM.messageInput.style.height = 'auto';
    const scrollHeight = DOM.messageInput.scrollHeight;
    DOM.messageInput.style.height = Math.min(scrollHeight, 150) + 'px';
}

function toggleSidebar() {
    appState.sidebarOpen = !appState.sidebarOpen;
    
    if (appState.sidebarOpen) {
        DOM.sidebar.classList.add('active');
    } else {
        DOM.sidebar.classList.remove('active');
    }
}

function toggleProfileMenu() {
    appState.profileMenuOpen = !appState.profileMenuOpen;
    
    if (appState.profileMenuOpen) {
        DOM.profileMenu.classList.remove('hidden');
    } else {
        DOM.profileMenu.classList.add('hidden');
    }
}

function openSettings() {
    DOM.settingsUsername.textContent = appState.currentUser.username;
    DOM.settingsDisplayName.textContent = appState.currentUser.displayName;
    DOM.settingsEmail.textContent = appState.currentUser.email;
    
    DOM.settingsModal.classList.remove('hidden');
    appState.profileMenuOpen = false;
    DOM.profileMenu.classList.add('hidden');
}

function closeSettings() {
    DOM.settingsModal.classList.add('hidden');
}

function showLoading() {
    DOM.loadingSpinner.classList.remove('hidden');
}

function hideLoading() {
    DOM.loadingSpinner.classList.add('hidden');
}

function showMainApp() {
    DOM.authModal.classList.remove('active');
    DOM.mainApp.classList.remove('hidden');
    updateProfileDisplay();
}

function showAuthModal() {
    DOM.authModal.classList.add('active');
    DOM.mainApp.classList.add('hidden');
}

function resetAuthForms() {
    DOM.loginEmail.value = '';
    DOM.loginPassword.value = '';
    DOM.registerUsername.value = '';
    DOM.registerDisplayName.value = '';
    DOM.registerEmail.value = '';
    DOM.registerPassword.value = '';
    DOM.otpCode.value = '';
    DOM.profilePicInput.value = '';
    DOM.profilePicPreview.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
    DOM.profilePicFileName.textContent = 'No image selected';
    
    switchAuthForm('loginForm');
}

function updateProfileDisplay() {
    if (appState.currentUser) {
        DOM.profileDisplayName.textContent = appState.currentUser.displayName;
        DOM.profileUsername.textContent = '@' + appState.currentUser.username;
        
        if (appState.currentUser.profilePic) {
            DOM.profileAvatarImg.src = appState.currentUser.profilePic;
        } else {
            // Create initials avatar
            const initials = appState.currentUser.displayName
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);
            
            DOM.profileAvatar.innerHTML = `<span style="font-size: 18px; font-weight: 700;">${initials}</span>`;
        }
    }
}

/* ========================================
   STORAGE FUNCTIONS
   ======================================== */

function saveUserDataToStorage(user) {
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'true');
}

function loadUserDataFromStorage() {
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    const isLoggedIn = localStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN) === 'true';
    
    if (userData && isLoggedIn) {
        appState.currentUser = JSON.parse(userData);
        appState.isLoggedIn = true;
    }
}

function saveChatsToStorage() {
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(appState.chats));
    if (appState.currentChatId) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_CHAT_ID, appState.currentChatId);
    }
}

function loadChatsFromStorage() {
    const chatsData = localStorage.getItem(STORAGE_KEYS.CHATS);
    const currentChatId = localStorage.getItem(STORAGE_KEYS.CURRENT_CHAT_ID);
    
    if (chatsData) {
        appState.chats = JSON.parse(chatsData);
    } else {
        appState.chats = {};
    }
    
    appState.currentChatId = currentChatId || null;
    
    renderChatList();
    
    if (appState.currentChatId) {
        renderMessages();
    }
}

function getAllUsersFromStorage() {
    const users = localStorage.getItem('tamai_all_users');
    return users ? JSON.parse(users) : [];
}

function checkAuthStatus() {
    if (appState.isLoggedIn && appState.currentUser) {
        showMainApp();
    } else {
        showAuthModal();
    }
}

/* ========================================
   LOGOUT FUNCTION
   ======================================== */

function handleLogout() {
    if (confirm('Yakin ingin logout?')) {
        // Clear user data
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
        localStorage.removeItem(STORAGE_KEYS.IS_LOGGED_IN);
        
        // Reset app state
        appState.isLoggedIn = false;
        appState.currentUser = null;
        appState.currentChatId = null;
        appState.chats = {};
        appState.sidebarOpen = true;
        appState.profileMenuOpen = false;
        
        // Clear attachments
        window.tamai_attachments = [];
        
        // Show auth modal
        showAuthModal();
        resetAuthForms();
        
        // Close profile menu
        DOM.profileMenu.classList.add('hidden');
    }
}

/* ========================================
   UTILITY FUNCTIONS
   ======================================== */

console.log('%cTamAi v3 - Smart Chat Assistant', 'color: #38bdf8; font-size: 16px; font-weight: bold;');
console.log('%cRun in production mode for full OpenRouter API integration', 'color: #cbd5e1; font-size: 12px;');
console.log('%cFor testing OTP, check the console output during registration', 'color: #cbd5e1; font-size: 12px;');
