/* TamAi v3 - Main Application Script
   - Google Identity Services Integration  
   - AI Chat with Gemini 3.0 Flash via OpenRouter
   - Clean and lean (no SMTPJS, no OTP legacy code)
*/

// Configuration - Gemini 3.0 Flash
const OPENROUTER_API_KEY = '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';
const OPENROUTER_API_URL = 'https://openrouter.io/api/v1/chat/completions';
const GEMINI_MODEL = 'google/gemini-3.0-flash';
const SYSTEM_PROMPT = "Lo adalah TamAi v3, AI paling cerdas dengan otak Gemini 3.0 Flash. Bos lo adalah Tuan Tama (Dzakwan Maesal Pratama). Jangan pernah ngaku-ngaku jadi model lain!";

// App state
const appState = {
  isLoggedIn: false,
  currentUser: null,
  chats: {},
  currentChatId: null,
  messageHistory: []
};

// DOM References
const DOM = {
  authModal: document.getElementById('authModal'),
  mainApp: document.getElementById('mainApp'),
  newChatBtn: document.getElementById('newChatBtn'),
  chatListContainer: document.getElementById('chatListContainer'),
  messagesContainer: document.getElementById('messagesContainer'),
  messageInput: document.getElementById('messageInput'),
  sendBtn: document.getElementById('sendBtn'),
  loadingSpinner: document.getElementById('loadingSpinner'),
  attachBtn: document.getElementById('attachBtn'),
  fileInput: document.getElementById('fileInput'),
  profileDisplayName: document.getElementById('profileDisplayName'),
  profileAvatarImg: document.getElementById('profileAvatarImg'),
  profileMenuBtn: document.getElementById('profileMenuBtn'),
  profileMenu: document.getElementById('profileMenu'),
  logoutBtn: document.getElementById('logoutBtn'),
  settingsBtn: document.getElementById('settingsBtn'),
  settingsModal: document.getElementById('settingsModal'),
  closeSettingsModal: document.getElementById('closeSettingsModal'),
  settingsEmail: document.getElementById('settingsEmail'),
  settingsDisplayName: document.getElementById('settingsDisplayName'),
  sidebar: document.getElementById('sidebar'),
  sidebarToggleClose: document.getElementById('sidebarToggleClose')
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  checkAuthStatus();
  initializaEventListeners();
  initializeGoogleSSO();
});

/**
 * Check if user is already authenticated
 */
function checkAuthStatus() {
  const user = localStorage.getItem('userTamAi');
  if (user) {
    appState.currentUser = JSON.parse(user);
    appState.isLoggedIn = true;
    showMainApp();
    loadUserChats();
  } else {
    showAuthModal();
  }
}

/**
 * Initialize Google Identity Services
 */
function initializeGoogleSSO() {
  if (window.google?.accounts?.id) {
    google.accounts.id.initialize({
      client_id: '164055469439-65jpo9bkenifr28df97i6l4g5vlvfiem.apps.googleusercontent.com',
      callback: handleCredentialResponse
    });
    google.accounts.id.renderButton(
      document.getElementById('g_id_onload'),
      { theme: 'outline', size: 'large' }
    );
    console.log('✅ Google Identity Services Initialized');
  }
}

/**
 * Handle Google credential response - JWT decode
 */
function handleCredentialResponse(response) {
  try {
    // Decode JWT payload
    const base64Url = response.credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const data = JSON.parse(jsonPayload);
    console.log('✅ Google Login Success:', data.name);

    // Prepare user data
    const userData = {
      name: data.name,
      email: data.email,
      picture: data.picture,
      authenticatedAt: new Date().toISOString(),
      provider: 'google'
    };

    // Save to localStorage
    localStorage.setItem('userTamAi', JSON.stringify(userData));

    // Update app state
    appState.currentUser = userData;
    appState.isLoggedIn = true;

    // Show main app
    if (DOM.authModal) DOM.authModal.classList.add('hidden');
    if (DOM.mainApp) DOM.mainApp.classList.remove('hidden');

    // Update UI
    updateProfileUI();
    loadUserChats();

    console.log('🎉 TamAi Chat Activated');
  } catch (error) {
    console.error('❌ Google Login Error:', error);
    alert('Login gagal. Silakan coba lagi.');
  }
}

/**
 * Initialize event listeners
 */
function initializaEventListeners() {
  // Chat
  if (DOM.newChatBtn) DOM.newChatBtn.addEventListener('click', createNewChat);
  if (DOM.sendBtn) DOM.sendBtn.addEventListener('click', sendMessage);
  if (DOM.messageInput) {
    DOM.messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    DOM.messageInput.addEventListener('input', adjustTextareaHeight);
  }

  // Attachments
  if (DOM.attachBtn) DOM.attachBtn.addEventListener('click', () => {
    if (DOM.fileInput) DOM.fileInput.click();
  });

  // Profile menu
  if (DOM.profileMenuBtn) DOM.profileMenuBtn.addEventListener('click', toggleProfileMenu);
  if (DOM.logoutBtn) DOM.logoutBtn.addEventListener('click', handleLogout);
  if (DOM.settingsBtn) DOM.settingsBtn.addEventListener('click', openSettingsModal);
  if (DOM.closeSettingsModal) DOM.closeSettingsModal.addEventListener('click', closeSettingsModal);

  // Close profile menu on click outside
  document.addEventListener('click', (e) => {
    if (DOM.profileMenu && !e.target.closest('.profile-section')) {
      DOM.profileMenu.classList.add('hidden');
    }
  });
}

/**
 * Update profile UI with user data
 */
function updateProfileUI() {
  if (!appState.currentUser) return;

  if (DOM.profileDisplayName) {
    DOM.profileDisplayName.textContent = appState.currentUser.name;
  }

  if (DOM.profileAvatarImg && appState.currentUser.picture) {
    DOM.profileAvatarImg.src = appState.currentUser.picture;
  }

  if (DOM.settingsDisplayName) {
    DOM.settingsDisplayName.textContent = appState.currentUser.name;
  }

  if (DOM.settingsEmail) {
    DOM.settingsEmail.textContent = appState.currentUser.email;
  }
}

/**
 * Create new chat
 */
function createNewChat() {
  appState.currentChatId = 'chat_' + Date.now();
  appState.messageHistory = [];
  appState.chats[appState.currentChatId] = {
    id: appState.currentChatId,
    title: 'New Chat',
    messages: [],
    createdAt: new Date().toISOString()
  };

  renderChatList();
  clearMessages();

  if (DOM.messageInput) DOM.messageInput.focus();
}

/**
 * Load user chats
 */
function loadUserChats() {
  const key = `chats_${appState.currentUser.email}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    appState.chats = JSON.parse(stored);
    if (Object.keys(appState.chats).length > 0) {
      appState.currentChatId = Object.keys(appState.chats)[0];
      appState.messageHistory = appState.chats[appState.currentChatId].messages || [];
    }
  } else {
    createNewChat();
  }

  renderChatList();
  renderMessages();
}

/**
 * Save chats to localStorage
 */
function saveChats() {
  const key = `chats_${appState.currentUser.email}`;
  localStorage.setItem(key, JSON.stringify(appState.chats));
}

/**
 * Render chat list
 */
function renderChatList() {
  if (!DOM.chatListContainer) return;

  DOM.chatListContainer.innerHTML = '';
  Object.values(appState.chats).forEach((chat) => {
    const chatItem = document.createElement('div');
    chatItem.className = `chat-item ${chat.id === appState.currentChatId ? 'active' : ''}`;
    chatItem.textContent = chat.title;
    chatItem.addEventListener('click', () => selectChat(chat.id));
    DOM.chatListContainer.appendChild(chatItem);
  });
}

/**
 * Select chat
 */
function selectChat(chatId) {
  appState.currentChatId = chatId;
  appState.messageHistory = appState.chats[chatId].messages || [];
  renderMessages();
  renderChatList();
}

/**
 * Send message to AI
 */
async function sendMessage() {
  const message = (DOM.messageInput?.value || '').trim();
  if (!message) return;

  if (!appState.currentChatId) createNewChat();

  // Add user message
  appState.messageHistory.push({
    type: 'user',
    content: message
  });

  // Clear input and hide spinner
  if (DOM.messageInput) DOM.messageInput.value = '';
  adjustTextareaHeight();
  renderMessages();

  // Show loading
  if (DOM.loadingSpinner) DOM.loadingSpinner.classList.remove('hidden');

  try {
    // Call OpenRouter API
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://tamai.local'
      },
      body: JSON.stringify({
        model: GEMINI_MODEL,
        messages: formatMessagesForAPI(),
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || 'No response';

    // Add AI response
    appState.messageHistory.push({
      type: 'assistant',
      content: aiMessage
    });

    renderMessages();

    // Save to localStorage
    appState.chats[appState.currentChatId].messages = appState.messageHistory;
    saveChats();

  } catch (error) {
    console.error('❌ Chat Error:', error);
    appState.messageHistory.push({
      type: 'assistant',
      content: '❌ Terjadi kesalahan. Silakan coba lagi.'
    });
    renderMessages();
  } finally {
    if (DOM.loadingSpinner) DOM.loadingSpinner.classList.add('hidden');
  }
}

/**
 * Format messages for OpenRouter API
 */
function formatMessagesForAPI() {
  const messages = [
    {
      role: 'system',
      content: SYSTEM_PROMPT
    }
  ];

  appState.messageHistory.forEach(msg => {
    messages.push({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content
    });
  });

  return messages;
}

/**
 * Render messages
 */
function renderMessages() {
  if (!DOM.messagesContainer) return;

  DOM.messagesContainer.innerHTML = '';

  appState.messageHistory.forEach(msg => {
    const msgEl = document.createElement('div');
    msgEl.className = `message message-${msg.type}`;
    msgEl.textContent = msg.content;
    DOM.messagesContainer.appendChild(msgEl);
  });

  // Scroll to bottom
  DOM.messagesContainer.scrollTop = DOM.messagesContainer.scrollHeight;
}

/**
 * Clear messages
 */
function clearMessages() {
  if (DOM.messagesContainer) {
    DOM.messagesContainer.innerHTML = '';
  }
}

/**
 * Adjust textarea height
 */
function adjustTextareaHeight() {
  if (DOM.messageInput) {
    DOM.messageInput.style.height = 'auto';
    DOM.messageInput.style.height = Math.min(DOM.messageInput.scrollHeight, 150) + 'px';
  }
}

/**
 * Toggle profile menu
 */
function toggleProfileMenu() {
  if (DOM.profileMenu) {
    DOM.profileMenu.classList.toggle('hidden');
  }
}

/**
 * Open settings modal
 */
function openSettingsModal() {
  if (DOM.settingsModal) {
    DOM.settingsModal.classList.remove('hidden');
  }
  toggleProfileMenu();
}

/**
 * Close settings modal
 */
function closeSettingsModal() {
  if (DOM.settingsModal) {
    DOM.settingsModal.classList.add('hidden');
  }
}

/**
 * Logout
 */
function handleLogout() {
  localStorage.removeItem('userTamAi');
  appState.isLoggedIn = false;
  appState.currentUser = null;
  appState.messageHistory = [];

  if (DOM.authModal) DOM.authModal.classList.remove('hidden');
  if (DOM.mainApp) DOM.mainApp.classList.add('hidden');

  console.log('👋 Logged out');
}

/**
 * Show auth modal
 */
function showAuthModal() {
  if (DOM.authModal) DOM.authModal.classList.remove('hidden');
  if (DOM.mainApp) DOM.mainApp.classList.add('hidden');
}

/**
 * Show main app
 */
function showMainApp() {
  if (DOM.authModal) DOM.authModal.classList.add('hidden');
  if (DOM.mainApp) DOM.mainApp.classList.remove('hidden');
}

console.log('✅ TamAi v3 - Gemini 3.0 Flash Ready');

