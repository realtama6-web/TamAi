/* ========================================
   TAMAI v3 - AUTHENTICATION MODULE
   OTP via SMTPJS + Developer Bypass
   ======================================== */

import { 
  SMTP_CONFIG, 
  BYPASS_CREDENTIALS, 
  OTP_CONFIG 
} from '../utils/config.js';

import { 
  Validators, 
  Storage, 
  OTPUtils 
} from '../utils/validator.js';

/**
 * AuthManager - Complete authentication system
 * Handles: Registration, Login, OTP, Developer Bypass
 */
export class AuthManager {
  constructor() {
    this.currentUser = null;
    this.isBypassMode = false;
    this.loadSession();
  }

  /**
   * Load existing session from storage
   */
  loadSession() {
    if (Storage.isLoggedIn()) {
      this.currentUser = Storage.getCurrentUser();
    }
  }

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return Storage.isLoggedIn() && this.currentUser !== null;
  }

  /**
   * Register new user (creates temp user, triggers OTP)
   * @param {Object} userData - {username, displayName, email, password}
   * @returns {Promise<boolean>}
   */
  async registerUser(userData) {
    const { username, displayName, email, password } = userData;

    // Validate all fields
    if (!username || !displayName || !email || !password) {
      throw new Error('Semua field harus diisi');
    }

    if (!Validators.isValidEmail(email)) {
      throw new Error('Email tidak valid');
    }

    if (!Validators.isValidUsername(username)) {
      throw new Error('Username harus lowercase, tanpa spasi');
    }

    if (!Validators.isValidPassword(password)) {
      throw new Error('Password minimal 6 karakter');
    }

    // Check if user already exists
    const existingUsers = Storage.getAllUsers();
    if (existingUsers.some(u => u.email === email || u.username === username)) {
      throw new Error('Email atau username sudah terdaftar');
    }

    // Store temp user in session
    const tempUser = { username, displayName, email, password };
    sessionStorage.setItem('tamai_temp_user', JSON.stringify(tempUser));

    // Generate and send OTP
    await this.sendOTP(email);

    return true;
  }

  /**
   * Generate and send OTP to email
   * @param {string} email
   * @returns {Promise<boolean>}
   */
  async sendOTP(email) {
    const otp = OTPUtils.generate();
    OTPUtils.store(otp);

    console.log('📨 OTP Generated:', {
      email: email,
      otp: otp,
      timeout: 5 * 60 + 's'
    });

    // Start 2-second timeout to show bypass button if OTP takes too long
    let timeoutReached = false;
    const bypassTimeout = setTimeout(() => {
      timeoutReached = true;
      console.warn('⏱️ OTP Send Timeout (2s) - Showing Bypass Button');
      this._emitEvent('otp-timeout', { email });
    }, OTP_CONFIG.SEND_TIMEOUT_MS);

    try {
      const sent = await this._sendEmailViaSmtpJS(email, otp);
      clearTimeout(bypassTimeout);

      if (sent) {
        console.log('✅ OTP Email Sent Successfully');
        this._emitEvent('otp-sent', { email });
        return true;
      } else {
        if (!timeoutReached) {
          console.error('❌ OTP Email Failed');
          this._emitEvent('otp-failed', { email });
        }
        return false;
      }
    } catch (error) {
      clearTimeout(bypassTimeout);
      console.error('❌ OTP Send Error:', error);
      if (!timeoutReached) {
        this._emitEvent('otp-error', { email, error });
      }
      return false;
    }
  }

  /**
   * Verify OTP code entered by user
   * @param {string} otpCode
   * @returns {boolean}
   */
  verifyOTP(otpCode) {
    if (!Validators.isValidOTP(otpCode)) {
      throw new Error('OTP harus 6 digit');
    }

    if (!OTPUtils.verify(otpCode)) {
      throw new Error('OTP salah atau sudah kadaluarsa');
    }

    return true;
  }

  /**
   * Complete registration after OTP verification
   * @returns {Object} - Created user object
   */
  completeRegistration() {
    const tempUserStr = sessionStorage.getItem('tamai_temp_user');
    if (!tempUserStr) {
      throw new Error('Session registrasi tidak ditemukan');
    }

    const tempUser = JSON.parse(tempUserStr);
    const newUser = {
      ...tempUser,
      profilePic: null,
      createdAt: new Date().toISOString()
    };

    // Save to users list
    const allUsers = Storage.getAllUsers();
    allUsers.push(newUser);
    Storage.saveAllUsers(allUsers);

    // Clear temp data
    sessionStorage.removeItem('tamai_temp_user');
    OTPUtils.clear();

    // Login user
    this.currentUser = newUser;
    Storage.saveCurrentUser(newUser);

    this._emitEvent('registration-complete', { user: newUser });
    return newUser;
  }

  /**
   * Login with email and password
   * @param {string} email
   * @param {string} password
   * @returns {Object} - User object
   */
  login(email, password) {
    if (!email || !password) {
      throw new Error('Email dan password harus diisi');
    }

    // Check if this is bypass credentials
    if (email.toLowerCase() === BYPASS_CREDENTIALS.email && 
        password === BYPASS_CREDENTIALS.password) {
      console.log('🔓 BYPASS DEVELOPER MODE ACTIVATED');
      this.isBypassMode = true;
      const bypassUser = {
        username: 'bypass_developer',
        displayName: 'Bypass Developer 🔓',
        email: email,
        password: 'bypass_secure_pass',
        profilePic: null,
        isBypass: true,
        loginTime: new Date().toISOString()
      };
      
      this.currentUser = bypassUser;
      Storage.saveCurrentUser(bypassUser);
      this._emitEvent('bypass-login', { user: bypassUser });
      
      // Send notification to admin
      this._notifyAdminBypass(email);
      
      return bypassUser;
    }

    // Normal login
    const allUsers = Storage.getAllUsers();
    const user = allUsers.find(u => u.email === email.toLowerCase());

    if (!user || user.password !== password) {
      throw new Error('Email atau password salah');
    }

    this.currentUser = user;
    Storage.saveCurrentUser(user);
    this._emitEvent('login', { user });

    return user;
  }

  /**
   * Logout current user
   */
  logout() {
    this.currentUser = null;
    this.isBypassMode = false;
    Storage.clearSession();
    OTPUtils.clear();
    sessionStorage.clear();
    this._emitEvent('logout');
  }

  /**
   * Get current user
   * @returns {Object|null}
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Update user profile (e.g., profile picture)
   * @param {Object} updates
   */
  updateProfile(updates) {
    if (!this.currentUser) {
      throw new Error('User tidak terautentikasi');
    }

    this.currentUser = { ...this.currentUser, ...updates };
    
    // Update in all users list
    const allUsers = Storage.getAllUsers();
    const userIndex = allUsers.findIndex(u => u.email === this.currentUser.email);
    if (userIndex >= 0) {
      allUsers[userIndex] = this.currentUser;
      Storage.saveAllUsers(allUsers);
    }

    Storage.saveCurrentUser(this.currentUser);
    this._emitEvent('profile-updated', { user: this.currentUser });
    
    return this.currentUser;
  }

  /**
   * Send email via SMTPJS (direct)
   * @private
   * @param {string} targetEmail
   * @param {string} code
   * @returns {Promise<boolean>}
   */
  async _sendEmailViaSmtpJS(targetEmail, code) {
    return new Promise((resolve) => {
      try {
        // Check if Email.send is available (SMTPJS is loaded)
        if (typeof Email === 'undefined') {
          console.error('❌ SMTPJS library not loaded');
          resolve(false);
          return;
        }

        Email.send({
          Host: SMTP_CONFIG.Host,
          Username: SMTP_CONFIG.Username,
          Password: SMTP_CONFIG.Password,
          To: targetEmail,
          From: SMTP_CONFIG.Username,
          Subject: 'Kode OTP TamAi v3',
          Body: `Kode OTP Anda: <strong>${code}</strong><br><br>Berlaku selama 5 menit.`,
          smtp_profile: 'custom_profile'
        }).then(response => {
          console.log('✅ Email sent:', response);
          resolve(true);
        }).catch(error => {
          console.error('❌ Email send error:', error);
          resolve(false);
        });
      } catch (error) {
        console.error('❌ SMTPJS error:', error);
        resolve(false);
      }
    });
  }

  /**
   * Notify admin about bypass login
   * @private
   * @param {string} email
   */
  async _notifyAdminBypass(email) {
    try {
      const message = `🚨 Bypass Developer Mode Activated\n\nEmail: ${email}\nTime: ${new Date().toISOString()}`;
      await this._sendEmailViaSmtpJS('tamaidev.id@gmail.com', message);
      console.log('📧 Notification sent to admin');
    } catch (error) {
      console.error('❌ Failed to notify admin:', error);
    }
  }

  /**
   * Emit custom events for UI updates
   * @private
   * @param {string} eventName
   * @param {Object} data
   */
  _emitEvent(eventName, data = {}) {
    const event = new CustomEvent(`auth:${eventName}`, { detail: data });
    window.dispatchEvent(event);
    console.log(`📢 Event: auth:${eventName}`, data);
  }
}

/**
 * Create singleton instance
 */
export const authManager = new AuthManager();

export default authManager;
