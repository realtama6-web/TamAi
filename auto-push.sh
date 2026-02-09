#!/bin/bash

# Auto Git Push Script untuk TamAi
# Jalankan: ./auto-push.sh atau bash auto-push.sh

echo "🚀 AUTO PUSH KE REPO DIMULAI..."

# Check jika ada perubahan
if [ -z "$(git status --porcelain)" ]; then
    echo "✅ Tidak ada perubahan, repo sudah up-to-date"
    exit 0
fi

# Show delta
echo "📝 Perubahan file:"
git status --short

# Add semua file
echo ""
echo "📦 Add semua file..."
git add .

# Commit dengan message otomatis
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
COMMIT_MSG="Auto-push: $TIMESTAMP"
git commit -m "$COMMIT_MSG"

# Push ke repo
echo ""
echo "⬆️ Push ke repository..."
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUKSES! Semua perubahan sudah push ke repo"
else
    echo ""
    echo "❌ ERROR! Push gagal"
    exit 1
fi
