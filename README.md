# TamAi v3 - Smart Chat Assistant

Aplikasi web modern untuk chat dengan AI, dibuat dengan HTML5, CSS3, dan Vanilla JavaScript murni. Desain Ice Blue Glassmorphism yang elegan dan fully responsive.

## 🌟 Fitur Utama

### 1. Sistem Login & OTP (Smart Auth)
- **Alur Pendaftaran**: Username → Display Name → Email → Password → OTP Verification → Profile Picture Upload
- **OTP Simulation**: Kode OTP ditampilkan di console untuk demo
- **Penyimpanan Data**: Semua data user disimpan di LocalStorage (Base64 untuk foto profil)
- **SMTP Config**: Tersimpan untuk referensi integrasi (Frontend Logic)
  - Email: `tamaidev.id@gmail.com`
  - App Password: `lehu vofk wrqp rgnp`

### 2. UI Ice Blue Glassmorphism
- Desain transparan dengan efek blur (backdrop-filter)
- Warna palette Ice Blue yang modern dan elegan
- Sidebar dengan profil section yang sticky di bagian bawah
- Tampilan profil: Avatar bulat + Display Name + @Username
- Popup menu dengan opsi "Pengaturan" dan "Logout"
- **Fully Responsive**: 100% rapi di mobile, tablet, dan desktop

### 3. Chat dengan AI (OpenRouter API)
- Integrasi dengan OpenRouter API untuk respons AI
- **Auto-Title**: Chat baru otomatis berubah judul dari "Chat Baru" menjadi ringkasan pesan pertama
- **Copy Code Button**: Tombol "Copy" otomatis muncul di pojok kanan atas setiap code block
- Markdown rendering untuk bold, italic, links, dan code
- Riwayat chat disimpan di LocalStorage

### 4. Multimedia & Attachment
- Tombol klip kertas untuk upload lampiran
- Support: Foto, Video, File Dokumen (PDF, DOC, XLS, PPT, TXT, CSV)
- Preview lampiran sebelum dikirim
- Tampilkan thumbnail untuk gambar dan video
- Maksimal 5 lampiran per pesan, maksimal 25MB per file

### 5. Responsive Design
- **Mobile-First Approach**: Sempurna di perangkat apa pun
- **Sidebar Toggle**: Burger menu untuk membuka/tutup sidebar di mobile
- **Touch Friendly**: Semua elemen dapat diakses dengan jari
- **Auto-Scroll**: Chat otomatis scroll ke pesan terbaru

## 🚀 Cara Menggunakan

### Setup Lokal
1. Clone atau download folder ini
2. Buka `index.html` di browser (Chrome, Firefox, Safari, Edge)
3. Atau host di GitHub Pages:
   - Push ke repository GitHub
   - Aktifkan GitHub Pages di Settings
   - Akses via `https://username.github.io/TamAi`

### Testing Login & OTP
1. Klik "Create New Account"
2. Isi Username, Display Name, Email, dan Password
3. Klik "Continue to OTP"
4. **Buka Console** (F12 → Console tab)
5. Copy kode OTP dari console
6. Paste ke input OTP
7. Upload atau skip foto profil
8. Mulai chat! 🎉

### Demo Credentials (Untuk Testing)
Gunakan email/password apa pun saat login. Aplikasi ini adalah demo dengan simulasi OTP di console.

## 📁 Struktur File

```
TamAi/
├── index.html      (Struktur HTML + Auth Modal + Main App UI)
├── style.css       (Glassmorphism Ice Blue + Responsive Design)
├── script.js       (Logic: Auth, OTP, Chat, API, Storage)
└── README.md       (File ini)
```

## 🔐 LocalStorage Schema

```javascript
// User Data
localStorage.tamai_user_data = {
  username: string,
  displayName: string,
  email: string,
  password: string,
  profilePic: base64 | null
}

// Login Status
localStorage.tamai_is_logged_in = true

// Chat History
localStorage.tamai_chats = {
  "chat_timestamp": {
    id: string,
    title: string,
    createdAt: ISO8601,
    messages: [
      {
        id: string,
        type: "user" | "assistant",
        content: string,
        attachments: array,
        timestamp: ISO8601
      }
    ]
  }
}

// Current Chat ID
localStorage.tamai_current_chat_id = "chat_timestamp"

// All Users (untuk demo)
localStorage.tamai_all_users = [{ user_objects }]
```

## 🎨 UI Components

### Color Palette
- Primary: `#0ea5e9` (Cyan)
- Secondary: `#06b6d4` (Teal)
- Background: `#0f172a` (Dark Blue)
- Text: `#f1f5f9` (Light Gray)

### Key Features
- **Glassmorphism**: `backdrop-filter: blur(15px);`
- **Smooth Transitions**: `0.3s cubic-bezier(0.4, 0, 0.2, 1)`
- **Responsive Grid**: Mobile-first dengan breakpoints di 768px dan 480px
- **Custom Scrollbar**: Ice blue themed

## 🔌 OpenRouter API Integration

Konfigurasi API:
```javascript
OPENROUTER_API_KEY = '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'
OPENROUTER_API_URL = 'https://openrouter.io/api/v1/chat/completions'
Model = 'gpt-3.5-turbo'
```

API digunakan untuk:
- Generate respons chatbot
- Menerima pesan user dengan context history
- Return markdown-formatted responses

## ✨ Fitur Spesial

### Auto-Title untuk Chat
Ketika pesan pertama dikirim, judul chat otomatis berubah dari "Chat Baru" menjadi ringkasan dari pesan pertama (max 50 karakter).

### Copy Code Button
Setiap code block yang di-generate AI (dalam tag `<pre><code>`) otomatis mendapat tombol "Copy" di pojok kanan atas. Klik tombol untuk copy ke clipboard.

### Sticky Sidebar Footer
Profile section di bawah sidebar tidak bergerak saat scroll chat, tetap sticky di bagian bawah.

### Markdown Rendering
- `**bold**` → **bold**
- `*italic*` → *italic*
- `` `code` `` → `code`
- `[link](url)` → link dengan target="_blank"
- `` ```language ... ``` `` → code block dengan syntax highlighting

### Attachment Management
- File input dengan drag-drop support (CSS)
- Preview sebelum dikirim
- Bisa hapus individual file
- Support thumbnail untuk image/video

## 🔒 Security Notes

⚠️ **PENTING untuk Production**:
- Jangan simpan password di browser (hanya untuk demo)
- Gunakan backend API untuk authentication
- Implement HTTPS untuk transmisi data
- Validate input di server side
- Use secure token untuk session management
- Implement rate limiting untuk API calls

## 📱 Device Support

- **Desktop**: Chrome, Firefox, Safari, Edge (latest)
- **Tablet**: iPad, Android tablets (full responsive)
- **Mobile**: iPhone, Android phones (optimized UI)

## 🐛 Troubleshooting

### OTP tidak muncul?
- Buka DevTools (F12)
- Cek Console tab
- Kode OTP ditampilkan di sana untuk demo

### Chat tidak menyimpan?
- Pastikan localStorage diaktifkan di browser
- Cek di DevTools → Application → Local Storage

### Sidebar tidak tampil di mobile?
- Klik tombol burger (☰) di kiri atas
- Sidebar akan slide in dari kiri

### API error?
- Cek internet connection
- Verify API key di script.js
- Lihat response di Network tab (DevTools)

## 🚀 Deployment ke GitHub Pages

```bash
# 1. Push ke GitHub
git add .
git commit -m "Deploy TamAi v3"
git push origin main

# 2. Enable GitHub Pages
# Repo Settings → Pages → Source: main branch

# 3. Akses aplikasi
# https://username.github.io/repo-name
```

## 📝 Catatan Pengembangan

- Aplikasi menggunakan vanilla JavaScript tanpa framework
- CSS Grid dan Flexbox untuk layout responsive
- LocalStorage API untuk persistence
- FileReader API untuk upload gambar
- Fetch API untuk komunikasi dengan OpenRouter
- Clipboard API untuk copy functionality

## 🎯 Roadmap Fitur Mendatang

- [ ] Dark/Light mode toggle
- [ ] Voice message support
- [ ] Chat sharing dengan link
- [ ] Export chat as PDF
- [ ] Multi-language support
- [ ] User profile customization
- [ ] Chat search functionality
- [ ] Conversation archiving

## 📄 License

Free to use and modify for personal and commercial projects.

## 💬 Support

Untuk pertanyaan atau issue, silakan buka GitHub issue atau hubungi developer.

---

**TamAi v3** © 2026 | Smart Chat Assistant | Built with ❤️ using Vanilla JS
