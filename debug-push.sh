#!/bin/bash

echo "🔍 Checking git status..."
echo ""

# Check git user config
echo "1️⃣ Checking git user config..."
git config user.name
git config user.email
echo ""

# Check branch
echo "2️⃣ Current branch:"
git branch
echo ""

# Check remote
echo "3️⃣ Remote URL:"
git remote -v
echo ""

# Check status
echo "4️⃣ Git status:"
git status
echo ""

# Try to push with verbose output
echo "5️⃣ Attempting push..."
git push -v origin main 2>&1

echo ""
echo "✅ Debug complete!"
