/* ========================================
   TAMAI v3 - MAIN APPLICATION
   Entry point yang menghubungkan semua modules
   ======================================== */

import { authManager } from './auth.js';
import { aiEngine } from './ai-engine.js';
import { uiManager } from './ui-handler.js';
import { Storage } from '../utils/validator.js';

/**
 * Application State Manager
 */
class AppState {
  constructor() {
    this.isLoggedIn = false;
    this.currentUser = null;
    this.chats = {};
    this.currentChatId = null;
  }

  setUser(user) {
    this.currentUser = user;
    this.isLoggedIn = true;
  }

  clearUser() {
    this.currentUser = null;
    this.isLoggedIn = false;
  }

  saveChats(chats) {
    if (!this.currentUser) return;
    this.chats = chats;
    Storage.saveChats(this.currentUser.email, chats);
  }

  loadChats() {
    if (!this.currentUser) return;
    this.chats = Storage.getChats(this.currentUser.email);
    this.currentChatId = null;
  }
}

/**
 * Main Application
 */
class TamAi {
  constructor() {
    this.appState = new AppState();
    this.setupAutomatically();
  }

  /**
   * Initialize application on DOM ready
   */
  setupAutomatically() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  /**
   * Initialize the app
   */
  async init() {
    console.log('🚀 TamAi v3 initializing...');
    
    // Load saved session
    if (authManager.isAuthenticated()) {
      this.appState.setUser(authManager.getCurrentUser());
      this.showMainApp();
    } else {
      this.showAuthModal();
    }

    this.setupEventListeners();
  }

  /**
   * Setup all event listeners
   */
  setupEventListeners() {
    // Auth Events
    window.addEventListener('ui:login-submit', (e) => this.handleLogin(e.detail));
    window.addEventListener('ui:register-submit', (e) => this.handleRegister(e.detail));
    window.addEventListener('ui:otp-submit', (e) => this.handleOTPSubmit(e.detail));
    window.addEventListener('ui:resend-otp', () => this.handleResendOTP());
    window.addEventListener('ui:bypass-dev-click', () => this.handleBypassDevClick());
    window.addEventListener('ui:logout-click', () => this.handleLogout());

    // Chat Events
    window.addEventListener('ui:new-chat', () => this.createNewChat());
    window.addEventListener('ui:send-message', (e) => this.handleSendMessage(e.detail));
    window.addEventListener('ui:select-chat', (e) => this.selectChat(e.detail.chatId));
    window.addEventListener('ui:delete-chat', (e) => this.deleteChat(e.detail.chatId));

    // Auth Manager Events
    window.addEventListener('auth:otp-timeout', () => {
      uiManager.highlightBypassButton();
    });
  }

  /**
   * Handle login
   */
  async handleLogin(data) {
    try {
      const user = authManager.login(data.email, data.password);
      this.appState.setUser(user);
      this.appState.loadChats();
      this.showMainApp();
      uiManager.showNotification('✅ Login berhasil!', 'success');
    } catch (error) {
      uiManager.showNotification(`❌ ${error.message}`, 'error');
      console.error('Login error:', error);
    }
  }

  /**
   * Handle registration
   */
  async handleRegister(data) {
    try {
      await authManager.registerUser(data);
      uiManager.showOTPForm(data.email);
      uiManager.showNotification('📧 OTP telah dikirim!', 'success');
    } catch (error) {
      uiManager.showNotification(`❌ ${error.message}`, 'error');
      console.error('Register error:', error);
    }
  }

  /**
   * Handle OTP verification
   */
  async handleOTPSubmit(data) {
    try {
      authManager.verifyOTP(data.code);
      const user = authManager.completeRegistration();
      this.appState.setUser(user);
      this.appState.loadChats();
      this.showMainApp();
      uiManager.showNotification('✅ Akun dibuat dan login berhasil!', 'success');
    } catch (error) {
      uiManager.showNotification(`❌ ${error.message}`, 'error');
      console.error('OTP error:', error);
    }
  }

  /**
   * Handle OTP resend
   */
  async handleResendOTP() {
    try {
      const tempUser = JSON.parse(sessionStorage.getItem('tamai_temp_user') || '{}');
      if (!tempUser.email) {
        throw new Error('Email tidak ditemukan');
      }
      await authManager.sendOTP(tempUser.email);
      uiManager.showNotification('📧 OTP telah dikirim ulang!', 'success');
    } catch (error) {
      uiManager.showNotification(`❌ ${error.message}`, 'error');
    }
  }

  /**
   * Handle bypass developer click
   */
  handleBypassDevClick() {
    const email = prompt('📧 Masukkan Email untuk Bypass Developer:');
    if (!email) return;

    const password = prompt('🔐 Masukkan Password untuk Bypass Developer:');
    if (!password) return;

    try {
      const user = authManager.login(email.toLowerCase(), password);
      this.appState.setUser(user);
      this.appState.loadChats();
      this.showMainApp();
      uiManager.showNotification('✅ Bypass Developer Mode Activated!', 'success');
    } catch (error) {
      uiManager.showNotification(`❌ ${error.message}`, 'error');
    }
  }

  /**
   * Handle logout
   */
  handleLogout() {
    authManager.logout();
    this.appState.clearUser();
    this.appState.chats = {};
    this.showAuthModal();
    uiManager.showNotification('👋 Anda berhasil logout', 'success');
  }

  /**
   * Create new chat
   */
  createNewChat() {
    const id = `chat_${Date.now()}`;
    this.appState.chats[id] = {
      id,
      title: 'Chat Baru',
      createdAt: new Date().toISOString(),
      messages: []
    };
    this.appState.currentChatId = id;
    this.appState.saveChats(this.appState.chats);
    this.renderChatList();
    this.renderMessages();
  }

  /**
   * Select specific chat
   */
  selectChat(chatId) {
    this.appState.currentChatId = chatId;
    this.appState.saveChats(this.appState.chats);
    this.renderMessages();
  }

  /**
   * Delete chat
   */
  deleteChat(chatId) {
    delete this.appState.chats[chatId];
    if (this.appState.currentChatId === chatId) {
      this.appState.currentChatId = null;
    }
    this.appState.saveChats(this.appState.chats);
    this.renderChatList();
    this.renderMessages();
  }

  /**
   * Send message to AI
   */
  async handleSendMessage(data) {
    const { message } = data;
    
    if (!this.appState.currentChatId) {
      this.createNewChat();
    }

    const chat = this.appState.chats[this.appState.currentChatId];
    if (!chat) return;

    // Add user message
    const userMsg = {
      id: `msg_${Date.now()}`,
      type: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    chat.messages.push(userMsg);

    // Update chat title if it's the first message
    if (chat.messages.length === 1) {
      chat.title = message.substring(0, 50);
    }

    this.appState.saveChats(this.appState.chats);
    this.renderChatList();
    this.renderMessages();

    // Get AI response
    uiManager.showLoading();
    try {
      const aiResponse = await aiEngine.chat(message, chat.messages.slice(0, -1));
      const aiMsg = {
        id: `msg_${Date.now()}`,
        type: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString()
      };
      chat.messages.push(aiMsg);
      this.appState.saveChats(this.appState.chats);
      this.renderMessages();
    } catch (error) {
      console.error('AI Error:', error);
      const errMsg = {
        id: `msg_${Date.now()}`,
        type: 'assistant',
        content: '❌ Terjadi error. Silakan coba lagi nanti.',
        timestamp: new Date().toISOString()
      };
      chat.messages.push(errMsg);
      this.appState.saveChats(this.appState.chats);
      this.renderMessages();
      uiManager.showNotification('❌ Gagal mendapatkan respons AI', 'error');
    } finally {
      uiManager.hideLoading();
    }
  }

  /**
   * Render chat list
   */
  renderChatList() {
    uiManager.renderChatList(this.appState.chats);
  }

  /**
   * Render messages
   */
  renderMessages() {
    if (!this.appState.currentChatId) {
      uiManager.renderMessages([]);
      return;
    }

    const chat = this.appState.chats[this.appState.currentChatId];
    if (!chat) {
      uiManager.renderMessages([]);
      return;
    }

    uiManager.renderMessages(chat.messages);
  }

  /**
   * Show main app UI
   */
  showMainApp() {
    uiManager.showMainApp();
    this.renderChatList();
    this.renderMessages();
    if (this.appState.currentUser) {
      uiManager.updateProfileDisplay(this.appState.currentUser);
    }
  }

  /**
   * Show auth modal
   */
  showAuthModal() {
    uiManager.showAuthModal();
  }
}

// Initialize app when DOM is ready
const app = new TamAi();

// Export for debugging
window.TamAi = {
  app,
  authManager,
  aiEngine,
  uiManager
};

console.log('✅ TamAi v3 loaded. Type window.TamAi for debugging.');
