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
 * Check if user is already authenticated and show appropriate interface
 */
function checkAuthStatus() {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userData = localStorage.getItem('userData');

  if (isLoggedIn && userData) {
    console.log('✅ Existing session found');
    appState.currentUser = JSON.parse(userData);
    appState.isLoggedIn = true;
    
    showMainApp();
    updateProfileUI();
    loadUserChats();
  } else {
    console.log('🔐 No session, showing login');
    showAuthModal();
  }
}

/**
 * Initialize Google Identity Services with automatic button rendering
 */
function initializeGoogleSSO() {
  if (window.google?.accounts?.id) {
    try {
      google.accounts.id.initialize({
        client_id: '164055469439-65jpo9bkenifr28df97i6l4g5vlvfiem.apps.googleusercontent.com',
        callback: handleCredentialResponse,
        auto_select: false
      });

      // Render button in the g_id_onload container
      const signInContainer = document.getElementById('g_id_onload');
      if (signInContainer) {
        google.accounts.id.renderButton(signInContainer, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          locale: 'id'
        });
        console.log('✅ Google Sign-In Button Rendered');
      } else {
        console.warn('⚠️ g_id_onload container not found');
      }

      console.log('✅ Google Identity Services Initialized');
    } catch (error) {
      console.error('❌ Error initializing Google SSO:', error);
    }
  } else {
    console.warn('⚠️ Google identity services not loaded');
  }
}

/**
 * Handle Google credential response - JWT decode + redirect
 */
function handleCredentialResponse(response) {
  try {
    console.log("🔐 Token diterima. Memproses...");
    
    // Manual decode JWT payload (no external library)
    const decodedToken = JSON.parse(atob(response.credential.split('.')[1]));
    console.log("✅ JWT decoded (manual):", decodedToken);

    // Simpan ke localStorage
    const userData = {
      name: decodedToken.name,
      email: decodedToken.email,
      picture: decodedToken.picture,
      aud: decodedToken.aud,
      authenticatedAt: new Date().toISOString(),
      provider: 'google'
    };
    
    console.log("💾 Menyimpan data ke localStorage...");
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userData', JSON.stringify(userData));
    localStorage.setItem('userTamAi', JSON.stringify(userData));
    
    console.log("✅ Data tersimpan!");
    console.log("👤 Login as:", userData.name);
    
    // Update app state
    appState.currentUser = userData;
    appState.isLoggedIn = true;
    
    // Sembunyikan auth modal, tampilkan chat interface
    console.log("🎨 Mengubah UI...");
    const authModal = document.getElementById('authModal');
    const mainApp = document.getElementById('mainApp');
    
    if (authModal) {
      authModal.style.display = 'none';
      console.log("✅ Auth modal hidden");
    }
    if (mainApp) {
      mainApp.style.display = 'flex';
      console.log("✅ Main app displayed");
    }
    
    // Update profile UI
    updateProfileUI();
    loadUserChats();
    
    console.log("🎉 ZUP! Login berhasil! Chat interface aktif.");
    console.log("🚀 Ready to chat!");
    
    // Redirect to dashboard setelah login sukses (replace history)
    window.location.replace('index.html');
    
  } catch (error) {
    console.error('❌ Google Login Error:', error);
    console.error('Error details:', error.message);
    alert('Login gagal: ' + error.message);
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
  const authModal = document.getElementById('authModal');
  const mainApp = document.getElementById('mainApp');

  if (authModal) {
    authModal.style.display = 'flex';
    authModal.classList.add('active');
    authModal.classList.remove('hidden');
  }
  if (mainApp) {
    mainApp.style.display = 'none';
    mainApp.classList.add('hidden');
  }

  console.log('🔐 Login interface displayed');
}

/**
 * Show main app
 */
function showMainApp() {
  const authModal = document.getElementById('authModal');
  const mainApp = document.getElementById('mainApp');

  if (authModal) {
    authModal.style.display = 'none';
    authModal.classList.remove('active');
    authModal.classList.add('hidden');
  }
  if (mainApp) {
    mainApp.style.display = 'flex';
    mainApp.classList.remove('hidden');
  }

  console.log('🎨 Chat interface displayed');
}

/**
 * Clear all user data (debugging/reset function)
 */
function clearAllUserData() {
  try {
    localStorage.removeItem('userTamAi');
    localStorage.removeItem('tamai_current_user');
    localStorage.removeItem('tamai_is_logged_in');
    sessionStorage.clear();
    
    // Clear all chat data
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('chats_')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('✅ Semua data user sudah dihapus!');
    console.log('💾 Refresh halaman untuk login lagi...');
    
    // Show notification
    if (DOM.authModal) DOM.authModal.classList.remove('hidden');
    if (DOM.mainApp) DOM.mainApp.classList.add('hidden');
    
    window.location.reload();
  } catch (error) {
    console.error('❌ Error clearing data:', error);
  }
}

// Buat function global accessible
window.clearAllUserData = clearAllUserData;

console.log('✅ TamAi v3 - Gemini 3.0 Flash Ready');
console.log('💡 Tip: Ketik clearAllUserData() untuk reset semua data user');

