/* ========================================
   TAMAI v3 - UI HANDLER & EVENT MANAGER
   ======================================== */

import { UI_CONFIG, STORAGE_KEYS } from '../utils/config.js';
import { Storage, StringUtils } from '../utils/validator.js';

/**
 * UIManager - All UI interactions and events
 * Handles: DOM manipulation, forms, notifications, chat rendering
 */
export class UIManager {
  constructor() {
    this.DOM = this._cacheDOM();
    this.attachments = [];
    this.bindAllEvents();
  }

  /**
   * Cache all important DOM elements
   * @private
   * @returns {Object}
   */
  _cacheDOM() {
    return {
      // Auth Elements
      authModal: document.getElementById('authModal'),
      loginForm: document.getElementById('loginForm'),
      registerForm: document.getElementById('registerForm'),
      otpForm: document.getElementById('otpForm'),
      profilePicForm: document.getElementById('profilePicForm'),
      
      // Form inputs
      loginEmail: document.getElementById('loginEmail'),
      loginPassword: document.getElementById('loginPassword'),
      registerUsername: document.getElementById('registerUsername'),
      registerDisplayName: document.getElementById('registerDisplayName'),
      registerEmail: document.getElementById('registerEmail'),
      registerPassword: document.getElementById('registerPassword'),
      otpCode: document.getElementById('otpCode'),
      otpEmailDisplay: document.getElementById('otpEmailDisplay'),
      profilePicInput: document.getElementById('profilePicInput'),
      
      // Main App
      mainApp: document.getElementById('mainApp'),
      chatListContainer: document.getElementById('chatListContainer'),
      messagesContainer: document.getElementById('messagesContainer'),
      messageInput: document.getElementById('messageInput'),
      loadingSpinner: document.getElementById('loadingSpinner'),
      
      // Chat elements
      newChatBtn: document.getElementById('newChatBtn'),
      sendBtn: document.getElementById('sendBtn'),
      welcomeMessage: document.getElementById('welcomeMessage'),
      
      // Profile elements
      profileMenu: document.getElementById('profileMenu'),
      profileMenuBtn: document.getElementById('profileMenuBtn'),
      profileDisplayName: document.getElementById('profileDisplayName'),
      profileUsername: document.getElementById('profileUsername'),
      profileAvatarImg: document.getElementById('profileAvatarImg'),
      
      // Buttons
      resendOtpBtn: document.getElementById('resendOtpBtn'),
      bypassDevBtn: document.getElementById('bypassDevBtn'),
      logoutBtn: document.getElementById('logoutBtn')
    };
  }

  /**
   * Bind all event listeners
   */
  bindAllEvents() {
    // Form submissions
    if (this.DOM.loginForm) {
      const loginFormElement = this.DOM.loginForm.querySelector('form');
      if (loginFormElement) {
        loginFormElement.addEventListener('submit', (e) => {
          e.preventDefault();
          this._emitEvent('login-submit', {
            email: this.DOM.loginEmail?.value?.trim().toLowerCase(),
            password: this.DOM.loginPassword?.value?.trim()
          });
        });
      }
    }

    if (this.DOM.registerForm) {
      const registerFormElement = this.DOM.registerForm.querySelector('form');
      if (registerFormElement) {
        registerFormElement.addEventListener('submit', (e) => {
          e.preventDefault();
          this._emitEvent('register-submit', {
            username: this.DOM.registerUsername?.value?.trim(),
            displayName: this.DOM.registerDisplayName?.value?.trim(),
            email: this.DOM.registerEmail?.value?.trim().toLowerCase(),
            password: this.DOM.registerPassword?.value?.trim()
          });
        });
      }
    }

    if (this.DOM.otpForm) {
      const otpFormElement = this.DOM.otpForm.querySelector('form');
      if (otpFormElement) {
        otpFormElement.addEventListener('submit', (e) => {
          e.preventDefault();
          this._emitEvent('otp-submit', {
            code: this.DOM.otpCode?.value?.trim()
          });
        });
      }
    }

    // Buttons
    if (this.DOM.resendOtpBtn) {
      this.DOM.resendOtpBtn.addEventListener('click', () => {
        this._emitEvent('resend-otp');
      });
    }

    if (this.DOM.bypassDevBtn) {
      this.DOM.bypassDevBtn.addEventListener('click', () => {
        this._emitEvent('bypass-dev-click');
      });
    }

    if (this.DOM.logoutBtn) {
      this.DOM.logoutBtn.addEventListener('click', () => {
        if (confirm('Yakin ingin logout?')) {
          this._emitEvent('logout-click');
        }
      });
    }

    // Chat
    if (this.DOM.newChatBtn) {
      this.DOM.newChatBtn.addEventListener('click', () => {
        this._emitEvent('new-chat');
      });
    }

    if (this.DOM.sendBtn) {
      this.DOM.sendBtn.addEventListener('click', () => {
        const message = this.DOM.messageInput?.value?.trim();
        if (message) {
          this._emitEvent('send-message', { message });
          this.DOM.messageInput.value = '';
          this.adjustTextareaHeight();
        }
      });
    }

    if (this.DOM.messageInput) {
      this.DOM.messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.DOM.sendBtn?.click();
        }
      });

      this.DOM.messageInput.addEventListener('input', () => {
        this.adjustTextareaHeight();
      });
    }

    // Profile menu
    if (this.DOM.profileMenuBtn) {
      this.DOM.profileMenuBtn.addEventListener('click', () => {
        this.DOM.profileMenu?.classList.toggle('hidden');
      });
    }

    // Close profile menu on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.profile-section') && !e.target.closest('.profile-menu')) {
        this.DOM.profileMenu?.classList.add('hidden');
      }
    });
  }

  /**
   * Switch authentication form
   * @param {string} formId
   */
  switchAuthForm(formId) {
    document.querySelectorAll('.auth-form')?.forEach(f => {
      f.classList.remove('active');
    });
    const form = document.getElementById(formId);
    if (form) {
      form.classList.add('active');
    }
  }

  /**
   * Show authentication modal
   */
  showAuthModal() {
    if (this.DOM.authModal) {
      this.DOM.authModal.classList.add('active');
    }
    if (this.DOM.mainApp) {
      this.DOM.mainApp.classList.add('hidden');
    }
  }

  /**
   * Show main application
   */
  showMainApp() {
    if (this.DOM.authModal) {
      this.DOM.authModal.classList.remove('active');
    }
    if (this.DOM.mainApp) {
      this.DOM.mainApp.classList.remove('hidden');
    }
  }

  /**
   * Show OTP form
   * @param {string} email
   */
  showOTPForm(email) {
    if (this.DOM.otpEmailDisplay) {
      this.DOM.otpEmailDisplay.textContent = `📧 Kode OTP akan dikirim ke ${email}`;
    }
    this.switchAuthForm('otpForm');
  }

  /**
   * Show loading indicator
   */
  showLoading() {
    if (this.DOM.loadingSpinner) {
      this.DOM.loadingSpinner.classList.remove('hidden');
    }
  }

  /**
   * Hide loading indicator
   */
  hideLoading() {
    if (this.DOM.loadingSpinner) {
      this.DOM.loadingSpinner.classList.add('hidden');
    }
  }

  /**
   * Show notification toast
   * @param {string} message
   * @param {string} type - 'success', 'error', 'warning', 'info'
   */
  showNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `notification notification-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 9999;
      animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(toast);
    console.log(`[${type.toUpperCase()}] ${message}`);

    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => toast.remove(), 300);
    }, UI_CONFIG.NOTIFICATION_DURATION);
  }

  /**
   * Show bypass button highlight when OTP times out
   */
  highlightBypassButton() {
    if (this.DOM.bypassDevBtn) {
      this.DOM.bypassDevBtn.classList.add('highlight-error');
      this.DOM.bypassDevBtn.textContent = '⚠️ OTP Timeout - Gunakan Jalur Bypass Developer';
      this.showNotification('⚠️ OTP lambat. Coba Bypass Developer jika perlu.', 'warning');
    }
  }

  /**
   * Update profile display
   * @param {Object} user
   */
  updateProfileDisplay(user) {
    if (!user) return;

    if (this.DOM.profileDisplayName) {
      this.DOM.profileDisplayName.textContent = user.displayName || '';
    }

    if (this.DOM.profileUsername) {
      this.DOM.profileUsername.innerHTML = `@${user.username || ''} <span class="pro-badge">PRO</span>`;
    }

    if (user.profilePic && this.DOM.profileAvatarImg) {
      this.DOM.profileAvatarImg.src = user.profilePic;
    } else if (this.DOM.profileAvatarImg) {
      const initials = StringUtils.getInitials(user.displayName);
      this.DOM.profileAvatarImg.style.display = 'none';
      const parent = this.DOM.profileAvatarImg.parentElement;
      if (parent && !parent.querySelector('.avatar-initials')) {
        const span = document.createElement('span');
        span.className = 'avatar-initials';
        span.textContent = initials;
        parent.appendChild(span);
      }
    }
  }

  /**
   * Render chat messages
   * @param {Array} messages
   */
  renderMessages(messages) {
    if (!this.DOM.messagesContainer) return;

    if (!messages || messages.length === 0) {
      this.DOM.messagesContainer.innerHTML = this.DOM.welcomeMessage?.outerHTML || '';
      return;
    }

    this.DOM.messagesContainer.innerHTML = '';
    messages.forEach(msg => {
      const msgEl = document.createElement('div');
      msgEl.className = `message message-${msg.type}`;
      msgEl.innerHTML = `<div class="message-content">${this._escapeHTML(msg.content)}</div>`;
      this.DOM.messagesContainer.appendChild(msgEl);
    });

    this.DOM.messagesContainer.scrollTop = this.DOM.messagesContainer.scrollHeight;
  }

  /**
   * Render chat list
   * @param {Object} chats
   */
  renderChatList(chats) {
    if (!this.DOM.chatListContainer) return;

    const chatIds = Object.keys(chats || {});
    if (chatIds.length === 0) {
      this.DOM.chatListContainer.innerHTML = '<div style="padding: 16px; color: var(--text-muted);">📭 Belum ada chat</div>';
      return;
    }

    this.DOM.chatListContainer.innerHTML = '';
    chatIds.reverse().forEach(id => {
      const chat = chats[id];
      const item = document.createElement('div');
      item.className = 'chat-list-item';
      item.innerHTML = `
        <button class="chat-btn" data-chat-id="${id}">
          ${StringUtils.truncate(chat.title || 'Chat', 30)}
        </button>
        <button class="chat-delete-btn" data-chat-id="${id}">🗑️</button>
      `;

      item.querySelector('.chat-btn').addEventListener('click', () => {
        this._emitEvent('select-chat', { chatId: id });
      });

      item.querySelector('.chat-delete-btn').addEventListener('click', () => {
        if (confirm('Hapus chat ini?')) {
          this._emitEvent('delete-chat', { chatId: id });
        }
      });

      this.DOM.chatListContainer.appendChild(item);
    });
  }

  /**
   * Adjust textarea height based on content
   */
  adjustTextareaHeight() {
    if (!this.DOM.messageInput) return;
    this.DOM.messageInput.style.height = 'auto';
    this.DOM.messageInput.style.height = Math.min(
      this.DOM.messageInput.scrollHeight,
      UI_CONFIG.TEXTAREA_MAX_HEIGHT
    ) + 'px';
  }

  /**
   * Escape HTML to prevent XSS
   * @private
   * @param {string} text
   * @returns {string}
   */
  _escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Emit custom events for app state management
   * @private
   * @param {string} eventName
   * @param {Object} data
   */
  _emitEvent(eventName, data = {}) {
    const event = new CustomEvent(`ui:${eventName}`, { detail: data });
    window.dispatchEvent(event);
  }
}

/**
 * Create singleton instance
 */
export const uiManager = new UIManager();

export default uiManager;
