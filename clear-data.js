#!/usr/bin/env node

/**
 * Script untuk clear semua data user dari localStorage
 * Jalankan: node clear-data.js atau buka di console browser
 */

// Simulasi localStorage clear untuk dokumentasi
const localStorageKeys = [
  'userTamAi',
  'tamai_current_user',
  'tamai_is_logged_in',
  'tamai_all_users',
  'tamai_temp_user',
  'tamai_otp',
  'tamai_otp_ts'
];

console.log('🧹 Clearing all TamAi user data...\n');

// In browser environment
if (typeof localStorage !== 'undefined') {
  // Clear specific keys
  localStorageKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      console.log(`✅ Deleted: ${key}`);
    }
  });

  // Clear all chat data
  const allKeys = Object.keys(localStorage);
  allKeys.forEach(key => {
    if (key.startsWith('chats_')) {
      localStorage.removeItem(key);
      console.log(`✅ Deleted: ${key}`);
    }
  });

  // Clear sessionStorage
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.clear();
    console.log('✅ Cleared sessionStorage');
  }

  console.log('\n✅ SEMUA DATA USER SUDAH DIHAPUS!');
  console.log('📝 Sekarang bisa daftar lagi pake email yang sama');
  console.log('\n🔄 Refresh halaman untuk mulai baru...');
} else {
  console.log('⚠️  Jalankan script ini di browser console, bukan Node.js');
  console.log('\n📋 Cara:\n');
  console.log('1. Buka DevTools (F12 atau Right-click → Inspect)');
  console.log('2. Pergi ke tab Console');
  console.log('3. Copy-paste kode di bawah:\n');
  console.log(`
// Clear localStorage
['userTamAi', 'tamai_current_user', 'tamai_is_logged_in', 'tamai_all_users', 'tamai_temp_user', 'tamai_otp', 'tamai_otp_ts'].forEach(k => localStorage.removeItem(k));
Object.keys(localStorage).forEach(k => k.startsWith('chats_') && localStorage.removeItem(k));
sessionStorage.clear();
location.reload();
  `);
}
