#!/bin/bash

echo "🔧 Fixing React project structure..."

# src 폴더 구조 생성
mkdir -p src/components/ui
mkdir -p src/contexts
mkdir -p src/hooks
mkdir -p src/lib

# 컴포넌트들을 src로 이동
echo "📁 Moving components..."
cp -r components/* src/components/ 2>/dev/null || echo "Components already in place"
cp -r contexts/* src/contexts/ 2>/dev/null || echo "Contexts already in place"
cp -r hooks/* src/hooks/ 2>/dev/null || echo "Hooks already in place"
cp -r lib/* src/lib/ 2>/dev/null || echo "Lib already in place"

# CSS 파일 이동
cp app/globals.css src/index.css 2>/dev/null || echo "CSS already in place"

echo "✅ Structure fixed!"
