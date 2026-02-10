/* ========================================
   TAMAI v3 - AUTHENTICATION MODULE
   Google Identity Services Integration
   ======================================== */


/**
 * Handle Google Credential Response
 * Called automatically by Google GSI when user authenticates
 * @param {Object} response - JWT response from Google
 */
function handleCredentialResponse(response) {
  try {
    // Decode JWT using jwt-decode library
    const data = jwt_decode(response.credential);
    console.log('✅ Google Login Success:', {
      name: data.name,
      email: data.email,
      picture: data.picture
    });

    // Prepare user data
    const userData = {
      name: data.name,
      email: data.email,
      picture: data.picture,
      authenticatedAt: new Date().toISOString(),
      provider: 'google'
    };

    // Save to localStorage with key 'userTamAi'
    localStorage.setItem('userTamAi', JSON.stringify(userData));
    console.log('💾 User data saved to localStorage');

    // Hide auth modal and show chat interface
    const authModal = document.getElementById('authModal');
    const mainApp = document.getElementById('mainApp');

    if (authModal) authModal.classList.add('hidden');
    if (mainApp) mainApp.classList.remove('hidden');

    // Update UI with user info
    updateUIWithUserData(userData);

    // Dispatch custom event for other components
    window.dispatchEvent(
      new CustomEvent('auth:google-login-success', {
        detail: userData
      })
    );

    console.log('🎉 TamAi Chat Interface Activated');

    // Redirect to dashboard after successful login
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 500);
  } catch (error) {
    console.error('❌ Google Login Error:', error);
    alert('Login gagal. Silakan coba lagi.');
  }
}

/**
 * Update UI with user data
 * @param {Object} userData - User data from Google
 */
function updateUIWithUserData(userData) {
  try {
    // Update profile display name
    const profileDisplayName = document.getElementById('profileDisplayName');
    if (profileDisplayName) {
      profileDisplayName.textContent = userData.name;
    }

    // Update profile avatar
    const profileAvatarImg = document.getElementById('profileAvatarImg');
    if (profileAvatarImg && userData.picture) {
      profileAvatarImg.src = userData.picture;
    }

    // Update profile email in settings
    const settingsEmail = document.getElementById('settingsEmail');
    if (settingsEmail) {
      settingsEmail.textContent = userData.email;
    }

    // Update profile display name in settings
    const settingsDisplayName = document.getElementById('settingsDisplayName');
    if (settingsDisplayName) {
      settingsDisplayName.textContent = userData.name;
    }

    console.log('✨ UI updated with user data');
  } catch (error) {
    console.error('⚠️ Failed to update UI:', error);
  }
}

/**
 * Get current user from localStorage
 * @returns {Object|null} User data or null if not logged in
 */
function getCurrentUser() {
  try {
    const userStr = localStorage.getItem('userTamAi');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('❌ Failed to get current user:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
function isUserAuthenticated() {
  return localStorage.getItem('userTamAi') !== null;
}

/**
 * Logout current user
 */
function logoutUser() {
  try {
    localStorage.removeItem('userTamAi');
    sessionStorage.clear();

    // Show auth modal and hide app
    const authModal = document.getElementById('authModal');
    const mainApp = document.getElementById('mainApp');

    if (authModal) authModal.classList.remove('hidden');
    if (mainApp) mainApp.classList.add('hidden');

    // Reset Google Identity Services
    if (window.google?.accounts?.id) {
      google.accounts.id.initialize({
        client_id: '164055469439-65jpo9bkenifr28df97i6l4g5vlvfiem.apps.googleusercontent.com',
        callback: handleCredentialResponse
      });
    }

    console.log('👋 User logged out successfully');

    window.dispatchEvent(
      new CustomEvent('auth:logout', {
        detail: { message: 'Successfully logged out' }
      })
    );
  } catch (error) {
    console.error('❌ Logout error:', error);
  }
}

/**
 * Check authentication on page load
 */
function checkAuthOnLoad() {
  const user = getCurrentUser();

  if (user) {
    console.log('✅ User already logged in:', user.name);

    // Show app and hide auth modal
    const authModal = document.getElementById('authModal');
    const mainApp = document.getElementById('mainApp');

    if (authModal) authModal.classList.add('hidden');
    if (mainApp) mainApp.classList.remove('hidden');

    // Update UI
    updateUIWithUserData(user);
  } else {
    console.log('🔐 No active session, showing auth modal');
  }
}

// Export for use in other modules
export {
  handleCredentialResponse,
  getCurrentUser,
  isUserAuthenticated,
  logoutUser,
  checkAuthOnLoad,
  updateUIWithUserData
};

/**
 * AuthManager - Simplified for Google SSO
 * Maintains compatibility with existing code
 */
export class AuthManager {
  constructor() {
    this.currentUser = null;
    this.loadSession();
  }

  loadSession() {
    this.currentUser = getCurrentUser();
  }

  isAuthenticated() {
    return isUserAuthenticated();
  }

  getCurrentUser() {
    return getCurrentUser();
  }

  logout() {
    logoutUser();
    this.currentUser = null;
  }

  updateProfile(updates) {
    if (!this.currentUser) {
      throw new Error('User tidak terautentikasi');
    }

    this.currentUser = { ...this.currentUser, ...updates };
    localStorage.setItem('userTamAi', JSON.stringify(this.currentUser));

    window.dispatchEvent(
      new CustomEvent('auth:profile-updated', {
        detail: { user: this.currentUser }
      })
    );

    return this.currentUser;
  }
}

/**
 * Create singleton instance
 */
export const authManager = new AuthManager();

export default authManager;