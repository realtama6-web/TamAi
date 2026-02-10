/* TamAi v3 - Cleaned script.js
   - Enter in textarea sends message to AI
   - OpenRouter API key is used directly
   - Chats stored per-user in localStorage under key 'chats_<email>'
   - OTP sent via SMTPJS direct (Username/Password)
   - Loading spinner shown while AI processing
   - Console logs for OTP sending
*/

// Configuration
const OPENROUTER_API_KEY = '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';
const OPENROUTER_API_URL = 'https://openrouter.io/api/v1/chat/completions';
const GEMINI_MODEL = 'google/gemini-3.0-flash';
const GEMINI_MODEL_FALLBACK = 'google/gemini-2.0-flash-exp:free';

const SMTP_DIRECT = {
  Host: 'smtp.gmail.com',
  Username: 'tamaidev.id@gmail.com',
  Password: 'ejyyrxlmnjmygoog'
};

// Bypass Developer Credentials
const BYPASS_CREDENTIALS = {
  email: 'realtama6@gmail.com',
  password: 'TamAi-ultimateby-dz/Tm'
};

// App state
const appState = {
  isLoggedIn: false,
  currentUser: null, // { username, displayName, email, password, profilePic }
  chats: {},
  currentChatId: null,
  isBypassMode: false // Track if user logged in via bypass
};

// DOM cache (cover main IDs present in index.html)
const DOM = {
  authModal: document.getElementById('authModal'),
  loginFormElement: document.getElementById('loginFormElement'),
  registerFormElement: document.getElementById('registerFormElement'),
  otpFormElement: document.getElementById('otpFormElement'),
  profilePicFormElement: document.getElementById('profilePicFormElement'),
  loginEmail: document.getElementById('loginEmail'),
  loginPassword: document.getElementById('loginPassword'),
  registerUsername: document.getElementById('registerUsername'),
  registerDisplayName: document.getElementById('registerDisplayName'),
  registerEmail: document.getElementById('registerEmail'),
  registerPassword: document.getElementById('registerPassword'),
  otpCode: document.getElementById('otpCode'),
  otpEmailDisplay: document.getElementById('otpEmailDisplay'),
  profilePicInput: document.getElementById('profilePicInput'),
  profilePicPreview: document.getElementById('profilePicPreview'),
  profilePicFileName: document.getElementById('profilePicFileName'),
  mainApp: document.getElementById('mainApp'),
  newChatBtn: document.getElementById('newChatBtn'),
  chatListContainer: document.getElementById('chatListContainer'),
  messagesContainer: document.getElementById('messagesContainer'),
  welcomeMessage: document.getElementById('welcomeMessage'),
  messageInput: document.getElementById('messageInput'),
  sendBtn: document.getElementById('sendBtn'),
  loadingSpinner: document.getElementById('loadingSpinner'),
  resendOtpBtn: document.getElementById('resendOtpBtn'),
  bypassDevBtn: document.getElementById('bypassDevBtn'),
  attachBtn: document.getElementById('attachBtn'),
  fileInput: document.getElementById('fileInput'),
  attachmentPreview: document.getElementById('attachmentPreview'),
  attachmentItems: document.getElementById('attachmentItems'),
  clearAttachmentsBtn: document.getElementById('clearAttachmentsBtn'),
  profileMenu: document.getElementById('profileMenu'),
  profileSection: document.getElementById('profileSection'),
  profileMenuBtn: document.getElementById('profileMenuBtn'),
  profileAvatar: document.getElementById('profileAvatar'),
  profileAvatarImg: document.getElementById('profileAvatarImg'),
  profileDisplayName: document.getElementById('profileDisplayName'),
  profileUsername: document.getElementById('profileUsername'),
  settingsBtn: document.getElementById('settingsBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  settingsModal: document.getElementById('settingsModal'),
  closeSettingsModal: document.getElementById('closeSettingsModal'),
  settingsUsername: document.getElementById('settingsUsername'),
  settingsDisplayName: document.getElementById('settingsDisplayName'),
  settingsEmail: document.getElementById('settingsEmail'),
  sidebar: document.getElementById('sidebar'),
  sidebarToggleClose: document.getElementById('sidebarToggleClose')
};

const OTP_LENGTH = 6;
const OTP_TIMEOUT_MS = 5 * 60 * 1000;

/* ---------- Initialization ---------- */
document.addEventListener('DOMContentLoaded', () => {
  loadUserFromStorage();
  bindEvents();
  if (appState.isLoggedIn) {
    showMainApp();
    loadChatsForCurrentUser();
  } else {
    showAuthModal();
  }
});

/* ---------- Events ---------- */
function bindEvents() {
  if (DOM.loginFormElement) DOM.loginFormElement.addEventListener('submit', handleLogin);
  if (DOM.registerFormElement) DOM.registerFormElement.addEventListener('submit', handleRegister);
  if (DOM.otpFormElement) DOM.otpFormElement.addEventListener('submit', handleOTPVerification);
  if (DOM.profilePicFormElement) DOM.profilePicFormElement.addEventListener('submit', handleProfilePicUpload);
  if (DOM.resendOtpBtn) DOM.resendOtpBtn.addEventListener('click', resendOTP);
  if (DOM.bypassDevBtn) DOM.bypassDevBtn.addEventListener('click', bypassDeveloperMode);

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

  if (DOM.attachBtn) DOM.attachBtn.addEventListener('click', () => DOM.fileInput && DOM.fileInput.click());
  if (DOM.fileInput) DOM.fileInput.addEventListener('change', handleFileSelection);
  if (DOM.clearAttachmentsBtn) DOM.clearAttachmentsBtn.addEventListener('click', clearAttachments);

  if (DOM.profileMenuBtn) DOM.profileMenuBtn.addEventListener('click', toggleProfileMenu);
  if (DOM.settingsBtn) DOM.settingsBtn.addEventListener('click', openSettings);
  if (DOM.logoutBtn) DOM.logoutBtn.addEventListener('click', handleLogout);
  if (DOM.closeSettingsModal) DOM.closeSettingsModal.addEventListener('click', closeSettings);

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.profile-section') && !e.target.closest('.profile-menu')) {
      DOM.profileMenu && DOM.profileMenu.classList.add('hidden');
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && DOM.sidebar) DOM.sidebar.classList.remove('active');
  });
}

/* ---------- Users & Storage ---------- */
function getAllUsersFromStorage() {
  const raw = localStorage.getItem('tamai_all_users');
  return raw ? JSON.parse(raw) : [];
}

function saveAllUsersToStorage(users) {
  localStorage.setItem('tamai_all_users', JSON.stringify(users));
}

function saveCurrentUser(user) {
  localStorage.setItem('tamai_current_user', JSON.stringify(user));
  localStorage.setItem('tamai_is_logged_in', 'true');
}

function loadUserFromStorage() {
  const logged = localStorage.getItem('tamai_is_logged_in') === 'true';
  const raw = localStorage.getItem('tamai_current_user');
  if (logged && raw) {
    appState.currentUser = JSON.parse(raw);
    appState.isLoggedIn = true;
  }
}

/* ---------- Auth Handlers ---------- */
async function handleLogin(e) {
  e.preventDefault();
  const email = (DOM.loginEmail && DOM.loginEmail.value || '').trim().toLowerCase();
  const password = (DOM.loginPassword && DOM.loginPassword.value || '').trim();
  if (!email || !password) return showNotification('Email dan password harus diisi', 'error');

  // Check BYPASS credentials
  if (email === BYPASS_CREDENTIALS.email && password === BYPASS_CREDENTIALS.password) {
    console.log('🔓 BYPASS DEVELOPER MODE ACTIVATED');
    const bypassUser = {
      username: 'bypass_developer',
      displayName: 'Bypass Developer',
      email: email,
      password: 'bypass_secure_pass',
      profilePic: null,
      isBypass: true
    };
    
    appState.currentUser = bypassUser;
    appState.isLoggedIn = true;
    appState.isBypassMode = true;
    saveCurrentUser(bypassUser);
    
    // Send notification email to tamaidev
    const notificationMsg = 'Tuan Tama telah masuk ke sistem via Bypass.';
    await sendEmailOTP('tamaidev.id@gmail.com', notificationMsg);
    
    loadChatsForCurrentUser();
    showMainApp();
    showNotification('✅ Bypass Developer - Akses diberikan & notifikasi terkirim!', 'success');
    return;
  }

  const users = getAllUsersFromStorage();
  const user = users.find(u => u.email === email);
  if (!user || user.password !== password) return showNotification('Email atau password salah', 'error');

  appState.currentUser = user; appState.isLoggedIn = true;
  saveCurrentUser(user);
  loadChatsForCurrentUser();
  showMainApp();
  showNotification('✅ Login berhasil!', 'success');
}

function handleRegister(e) {
  e.preventDefault();
  const username = (DOM.registerUsername && DOM.registerUsername.value || '').trim();
  const displayName = (DOM.registerDisplayName && DOM.registerDisplayName.value || '').trim();
  const email = (DOM.registerEmail && DOM.registerEmail.value || '').trim().toLowerCase();
  const password = (DOM.registerPassword && DOM.registerPassword.value || '').trim();

  if (!username || !displayName || !email || !password) return showNotification('Semua field harus diisi', 'error');
  if (password.length < 6) return showNotification('Password minimal 6 karakter', 'error');

  const users = getAllUsersFromStorage();
  if (users.some(u => u.email === email || u.username === username)) return showNotification('Email atau username sudah terdaftar', 'error');

  const tempUser = { username, displayName, email, password };
  sessionStorage.setItem('tamai_temp_user', JSON.stringify(tempUser));

  switchAuthForm('otpForm');
  DOM.otpEmailDisplay && (DOM.otpEmailDisplay.textContent = `📧 Kode OTP akan dikirim ke ${email}`);
  generateAndSendOTP(email);
}

function switchAuthForm(formId) {
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
  const el = document.getElementById(formId);
  if (el) el.classList.add('active');
}

/* ---------- OTP via SMTPJS (direct) ---------- */
async function sendEmailOTP(targetEmail, code) {
  try {
    // Check if code is OTP (6 digits) or a message
    const isOTP = /^\d{6}$/.test(code);
    const subject = isOTP ? 'OTP TamAi v3' : 'Notifikasi Keamanan TamAi';
    const body = isOTP ? ('Kode lo adalah ' + code) : code;
    
    await Email.send({
      Host: SMTP_DIRECT.Host,
      Username: SMTP_DIRECT.Username,
      Password: SMTP_DIRECT.Password,
      To: targetEmail,
      From: SMTP_DIRECT.Username,
      Subject: subject,
      Body: body
    });

    console.log('✅ Email berhasil dikirim!');
    console.log('EMAIL TERKIRIM KE:', targetEmail);
    return true;
  } catch (err) {
    console.error('❌ Gagal mengirim email:', err);
    return false;
  }
}

async function generateAndSendOTP(email) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  sessionStorage.setItem('tamai_otp', otp);
  sessionStorage.setItem('tamai_otp_ts', Date.now().toString());
  console.log('📨 Generating OTP untuk', email, '->', otp);

  const sent = await sendEmailOTP(email, otp);
  if (sent) {
    showNotification('📧 Kode OTP telah dikirim. Cek email Anda.', 'success');
  } else {
    showNotification('⚠️ Gagal mengirim OTP. Periksa konfigurasi SMTP.', 'error');
  }
}

function resendOTP() {
  const temp = sessionStorage.getItem('tamai_temp_user');
  if (!temp) return showNotification('Tidak ada proses pendaftaran aktif', 'error');
  const user = JSON.parse(temp);
  generateAndSendOTP(user.email);
}

async function handleOTPVerification(e) {
  e.preventDefault();
  const entered = (DOM.otpCode && DOM.otpCode.value || '').trim();
  const stored = sessionStorage.getItem('tamai_otp');
  const ts = parseInt(sessionStorage.getItem('tamai_otp_ts') || '0', 10);

  if (!entered || entered.length !== OTP_LENGTH) return showNotification('OTP harus 6 digit', 'error');
  if (Date.now() - ts > OTP_TIMEOUT_MS) return showNotification('OTP kadaluarsa', 'error');
  if (entered !== stored) return showNotification('OTP salah', 'error');

  // Check if this is bypass mode
  if (appState.isBypassMode) {
    // Bypass mode - create bypass user
    const bypassUser = {
      username: 'bypass_developer',
      displayName: 'Bypass Developer',
      email: 'realtama6@gmail.com',
      password: 'bypass_secure_pass',
      profilePic: null
    };
    
    appState.currentUser = bypassUser;
    appState.isLoggedIn = true;
    saveCurrentUser(bypassUser);
    
    // Send security notification to tamaidev
    const notificationMsg = 'Peringatan: Seseorang baru saja masuk menggunakan Bypass Developer dari email realtama6@gmail.com!';
    await sendEmailOTP('tamaidev.id@gmail.com', notificationMsg);
    
    sessionStorage.removeItem('tamai_otp');
    sessionStorage.removeItem('tamai_otp_ts');
    appState.isBypassMode = false;
    
    loadChatsForCurrentUser();
    showMainApp();
    showNotification('✅ Bypass Developer - Akses berhasil diberikan & notifikasi terkirim!', 'success');
    return;
  }

  // Normal registration flow
  const tempUser = JSON.parse(sessionStorage.getItem('tamai_temp_user') || 'null');
  if (!tempUser) return showNotification('User sementara tidak ditemukan', 'error');

  // save user
  const users = getAllUsersFromStorage();
  users.push(tempUser);
  saveAllUsersToStorage(users);

  // login
  appState.currentUser = tempUser; appState.isLoggedIn = true;
  saveCurrentUser(tempUser);

  sessionStorage.removeItem('tamai_temp_user');
  sessionStorage.removeItem('tamai_otp');
  sessionStorage.removeItem('tamai_otp_ts');

  loadChatsForCurrentUser();
  showMainApp();
  showNotification('✅ Akun dibuat dan login berhasil', 'success');
}

function bypassOTPForDev() {
  const tempUser = JSON.parse(sessionStorage.getItem('tamai_temp_user') || 'null');
  if (!tempUser) return showNotification('User sementara tidak ditemukan', 'error');

  // save user
  const users = getAllUsersFromStorage();
  users.push(tempUser);
  saveAllUsersToStorage(users);

  // login
  appState.currentUser = tempUser;
  appState.isLoggedIn = true;
  saveCurrentUser(tempUser);

  sessionStorage.removeItem('tamai_temp_user');
  sessionStorage.removeItem('tamai_otp');
  sessionStorage.removeItem('tamai_otp_ts');

  loadChatsForCurrentUser();
  showMainApp();
  showNotification('✅ Development bypass - akun langsung aktif', 'success');
}

async function bypassDeveloperMode() {
  // Ask for credentials
  const email = prompt('📧 Masukkan Email untuk Bypass Developer:');
  
  if (!email || !email.trim()) {
    showNotification('❌ Email tidak boleh kosong!', 'error');
    return;
  }
  
  const normalizedEmail = email.trim().toLowerCase();
  const password = prompt('🔐 Masukkan Password untuk Bypass Developer:');
  
  if (!password || !password.trim()) {
    showNotification('❌ Password tidak boleh kosong!', 'error');
    return;
  }
  
  // Check credentials
  if (normalizedEmail !== BYPASS_CREDENTIALS.email || password !== BYPASS_CREDENTIALS.password) {
    showNotification('❌ Email atau password Bypass Developer salah!', 'error');
    return;
  }
  
  // Bypass berhasil - login langsung ke Dashboard
  console.log('🔓 Bypass Developer Mode Activated with correct credentials');
  const bypassUser = {
    username: 'bypass_developer',
    displayName: 'Bypass Developer',
    email: normalizedEmail,
    password: 'bypass_secure_pass',
    profilePic: null,
    isBypass: true
  };
  
  appState.currentUser = bypassUser;
  appState.isLoggedIn = true;
  appState.isBypassMode = true;
  saveCurrentUser(bypassUser);
  
  // Send notification email to tamaidev
  const notificationMsg = 'Tuan Tama telah masuk ke sistem via Bypass.';
  await sendEmailOTP('tamaidev.id@gmail.com', notificationMsg);
  
  loadChatsForCurrentUser();
  showMainApp();
  showNotification('✅ Bypass Developer Berhasil - Dashboard terbuka & notifikasi terkirim!', 'success');
}

async function handleProfilePicUpload(e) {
  e.preventDefault();
  const file = DOM.profilePicInput && DOM.profilePicInput.files[0];
  if (!file) return showNotification('Pilih file terlebih dahulu', 'error');

  const reader = new FileReader();
  reader.onload = (ev) => {
    const dataUrl = ev.target.result;
    appState.currentUser.profilePic = dataUrl;
    const users = getAllUsersFromStorage();
    const idx = users.findIndex(u => u.email === appState.currentUser.email);
    if (idx >= 0) { users[idx] = appState.currentUser; saveAllUsersToStorage(users); }
    saveCurrentUser(appState.currentUser);
    DOM.profilePicFileName && (DOM.profilePicFileName.textContent = file.name);
    showMainApp();
  };
  reader.readAsDataURL(file);
}

/* ---------- Chats (per-user) ---------- */
function chatsStorageKey(email) { return `chats_${email}`; }
function saveChatsForCurrentUser() {
  if (!appState.currentUser) return;
  const key = chatsStorageKey(appState.currentUser.email);
  localStorage.setItem(key, JSON.stringify(appState.chats));
}
function loadChatsForCurrentUser() {
  appState.chats = {};
  appState.currentChatId = null;
  if (!appState.currentUser) return;
  const raw = localStorage.getItem(chatsStorageKey(appState.currentUser.email));
  if (raw) {
    try { appState.chats = JSON.parse(raw); } catch (e) { appState.chats = {}; }
  }
  renderChatList();
  if (appState.currentChatId) renderMessages();
}

/* ---------- Chat UI ---------- */
function createNewChat() {
  const id = 'chat_' + Date.now();
  appState.chats[id] = { id, title: 'Chat Baru', createdAt: new Date().toISOString(), messages: [] };
  appState.currentChatId = id;
  saveChatsForCurrentUser();
  renderChatList();
  renderMessages();
}

function selectChat(chatId) {
  appState.currentChatId = chatId; saveChatsForCurrentUser(); renderMessages();
}

function deleteChat(chatId, e) {
  e && e.stopPropagation();
  if (!confirm('Yakin ingin menghapus chat ini?')) return;
  delete appState.chats[chatId];
  if (appState.currentChatId === chatId) appState.currentChatId = null;
  saveChatsForCurrentUser(); renderChatList(); renderMessages();
}

function renderChatList() {
  if (!DOM.chatListContainer) return;
  DOM.chatListContainer.innerHTML = '';
  const ids = Object.keys(appState.chats || {});
  if (ids.length === 0) {
    DOM.chatListContainer.innerHTML = '<div style="padding:16px;color:var(--text-muted);">Belum ada chat</div>';
    return;
  }
  ids.reverse().forEach(id => {
    const chat = appState.chats[id];
    const btn = document.createElement('button'); btn.className = 'chat-item';
    btn.textContent = chat.title || 'Chat';
    btn.addEventListener('click', () => selectChat(id));
    const del = document.createElement('button'); del.className = 'chat-item-delete'; del.type = 'button'; del.textContent = 'Hapus';
    del.addEventListener('click', (e) => deleteChat(id, e));
    const wrapper = document.createElement('div'); wrapper.className = 'chat-list-row'; wrapper.appendChild(btn); wrapper.appendChild(del);
    DOM.chatListContainer.appendChild(wrapper);
  });
}

function renderMessages() {
  if (!DOM.messagesContainer) return;
  if (!appState.currentChatId) { DOM.messagesContainer.innerHTML = DOM.welcomeMessage ? DOM.welcomeMessage.outerHTML : ''; return; }
  const chat = appState.chats[appState.currentChatId];
  if (!chat || !chat.messages || chat.messages.length === 0) { DOM.messagesContainer.innerHTML = DOM.welcomeMessage ? DOM.welcomeMessage.outerHTML : ''; return; }
  DOM.messagesContainer.innerHTML = '';
  chat.messages.forEach(m => {
    const el = document.createElement('div'); el.className = 'message ' + m.type;
    const c = document.createElement('div'); c.className = 'message-content'; c.textContent = m.content;
    el.appendChild(c); DOM.messagesContainer.appendChild(el);
  });
  DOM.messagesContainer.scrollTop = DOM.messagesContainer.scrollHeight;
}

/* ---------- Sending messages & AI ---------- */
async function sendMessage() {
  const text = (DOM.messageInput && DOM.messageInput.value || '').trim();
  if (!text) return;
  if (!appState.currentChatId) createNewChat();
  const chat = appState.chats[appState.currentChatId];
  const userMsg = { id: 'msg_' + Date.now(), type: 'user', content: text, timestamp: new Date().toISOString() };
  chat.messages.push(userMsg);
  if (!chat.title || chat.title === 'Chat Baru') chat.title = text.substring(0, 50);
  saveChatsForCurrentUser(); renderMessages();
  DOM.messageInput.value = '';

  showLoading();
  try {
    const aiText = await getAIResponse(text, chat.messages);
    const aiMsg = { id: 'msg_' + Date.now(), type: 'assistant', content: aiText, timestamp: new Date().toISOString() };
    chat.messages.push(aiMsg);
    saveChatsForCurrentUser(); renderMessages();
  } catch (err) {
    console.error('❌ AI ERROR DETAILS:', err);
    console.error('Error message:', err.message);
    const errMsg = { id: 'msg_' + Date.now(), type: 'assistant', content: 'Terjadi error. Coba lagi nanti.' };
    chat.messages.push(errMsg);
    saveChatsForCurrentUser(); renderMessages();
  } finally {
    hideLoading();
  }
}

async function getAIResponse(prompt, messageHistory) {
  const messages = messageHistory.map(m => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.content }));
  console.log('📤 Sending to OpenRouter:', { model: GEMINI_MODEL, messages });
  
  try {
    const resp = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost'
      },
      body: JSON.stringify({
        model: GEMINI_MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    console.log('📥 Response status:', resp.status);
    
    if (!resp.ok) {
      const txt = await resp.text();
      console.error('❌ API Error Response:', txt);
      throw new Error('OpenRouter failed: ' + txt);
    }

    const data = await resp.json();
    console.log('✅ API Response data:', data);

    const content = data.choices?.[0]?.message?.content || data.result || '';
    if (!content) {
      console.error('❌ No content in response:', data);
      throw new Error('No response content from AI');
    }
    
    return content;
  } catch (err) {
    console.error('❌ AI Request Error:', err);
    throw err;
  }
}

/* ---------- Attachments (minimal) ---------- */
function handleFileSelection(e) {
  const files = e.target.files; if (!files || files.length === 0) return;
  Array.from(files).forEach(f => addAttachment(f));
  DOM.fileInput.value = '';
}

function addAttachment(file) {
  if (!window.tamai_attachments) window.tamai_attachments = [];
  if (window.tamai_attachments.length >= 5) return showNotification('Maksimal 5 lampiran', 'error');
  const reader = new FileReader();
  reader.onload = (ev) => { window.tamai_attachments.push({ id: 'att_' + Date.now(), name: file.name, type: file.type, data: ev.target.result }); renderAttachmentPreview(); };
  reader.readAsDataURL(file);
}

function renderAttachmentPreview() {
  const atts = window.tamai_attachments || [];
  if (!DOM.attachmentPreview) return;
  if (atts.length === 0) { DOM.attachmentPreview.classList.add('hidden'); return; }
  DOM.attachmentPreview.classList.remove('hidden'); DOM.attachmentItems.innerHTML = '';
  atts.forEach(a => {
    const item = document.createElement('div'); item.className = 'attachment-item';
    const name = document.createElement('div'); name.textContent = a.name; item.appendChild(name);
    const rem = document.createElement('button'); rem.textContent = 'X'; rem.addEventListener('click', () => removeAttachment(a.id)); item.appendChild(rem);
    DOM.attachmentItems.appendChild(item);
  });
}

function removeAttachment(id) { window.tamai_attachments = (window.tamai_attachments||[]).filter(a => a.id !== id); renderAttachmentPreview(); }
function clearAttachments() { window.tamai_attachments = []; renderAttachmentPreview(); }
function getAttachmentsList() { return window.tamai_attachments || []; }

/* ---------- UI helpers ---------- */
function adjustTextareaHeight() { if (!DOM.messageInput) return; DOM.messageInput.style.height = 'auto'; DOM.messageInput.style.height = Math.min(DOM.messageInput.scrollHeight, 150) + 'px'; }
function showLoading() { DOM.loadingSpinner && DOM.loadingSpinner.classList.remove('hidden'); }
function hideLoading() { DOM.loadingSpinner && DOM.loadingSpinner.classList.add('hidden'); }
function showMainApp() { DOM.authModal && DOM.authModal.classList.remove('active'); DOM.mainApp && DOM.mainApp.classList.remove('hidden'); updateProfileDisplay(); }
function showAuthModal() { DOM.authModal && DOM.authModal.classList.add('active'); DOM.mainApp && DOM.mainApp.classList.add('hidden'); }

function showNotification(message, type='info') {
  console.log(message);
  // minimal visual toast
  const el = document.createElement('div'); el.className = `notification ${type}`; el.textContent = message;
  el.style.cssText = 'position:fixed;top:20px;right:20px;padding:10px 14px;background:#333;color:#fff;border-radius:6px;z-index:9999;';
  document.body.appendChild(el); setTimeout(() => el.remove(), 3000);
}

/* ---------- Settings / Profile ---------- */
function toggleProfileMenu() { DOM.profileMenu && DOM.profileMenu.classList.toggle('hidden'); }
function openSettings() { if (!appState.currentUser) return; DOM.settingsUsername && (DOM.settingsUsername.textContent = appState.currentUser.username); DOM.settingsDisplayName && (DOM.settingsDisplayName.textContent = appState.currentUser.displayName); DOM.settingsEmail && (DOM.settingsEmail.textContent = appState.currentUser.email); DOM.settingsModal && DOM.settingsModal.classList.remove('hidden'); }
function closeSettings() { DOM.settingsModal && DOM.settingsModal.classList.add('hidden'); }
function handleLogout() { if (!confirm('Yakin logout?')) return; localStorage.removeItem('tamai_is_logged_in'); localStorage.removeItem('tamai_current_user'); appState.currentUser = null; appState.isLoggedIn = false; appState.chats = {}; appState.currentChatId = null; showAuthModal(); showNotification('Anda berhasil logout', 'success'); }

function updateProfileDisplay() {
  if (!appState.currentUser) return;
  DOM.profileDisplayName && (DOM.profileDisplayName.textContent = appState.currentUser.displayName || '');
  if (DOM.profileUsername) DOM.profileUsername.innerHTML = `@${appState.currentUser.username || ''} <span class="pro-badge">PRO</span>`;
  if (appState.currentUser.profilePic && DOM.profileAvatarImg) DOM.profileAvatarImg.src = appState.currentUser.profilePic;
  else if (DOM.profileAvatar) DOM.profileAvatar.innerHTML = `<span style="font-size:18px;font-weight:700;">${(appState.currentUser.displayName||'').split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}</span>`;
}

/* ---------- Misc ---------- */
function saveAllUsersToStorage(users) { saveAllUsersToStorage; } // placeholder to avoid accidental calls

console.log('TamAi script loaded');

/* End of file */
