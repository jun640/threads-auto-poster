#!/bin/bash

# Threads OAuth 認証フローテストスクリプト
# 使用方法: ./scripts/test-oauth.sh

echo "🔐 Threads OAuth 認証フローテスト"
echo "================================="
echo ""

# 開発サーバーが起動しているか確認
SERVER_URL="http://localhost:3002"
echo "📡 サーバー接続確認: $SERVER_URL"

if ! curl -s "$SERVER_URL" > /dev/null 2>&1; then
    echo "❌ エラー: 開発サーバーが起動していません"
    echo ""
    echo "以下のコマンドで起動してください:"
    echo "  npm run dev"
    exit 1
fi

echo "✅ サーバーが起動しています"
echo ""

# 認証URLを取得
echo "🔗 認証URL取得中..."
AUTH_RESPONSE=$(curl -s "$SERVER_URL/api/auth/login")

if [ $? -ne 0 ]; then
    echo "❌ エラー: 認証URLの取得に失敗しました"
    exit 1
fi

# URLを抽出
AUTH_URL=$(echo $AUTH_RESPONSE | grep -o '"url":"[^"]*"' | cut -d'"' -f4)

if [ -z "$AUTH_URL" ]; then
    echo "❌ エラー: 認証URLが見つかりません"
    echo "レスポンス: $AUTH_RESPONSE"
    exit 1
fi

echo "✅ 認証URL取得成功"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 認証URL:"
echo ""
echo "$AUTH_URL"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# URLの詳細を表示
echo "📊 URL詳細:"
echo ""
echo "  Base URL:      https://threads.net/oauth/authorize"
echo "  Client ID:     $(echo $AUTH_URL | grep -o 'client_id=[^&]*' | cut -d'=' -f2)"
echo "  Redirect URI:  $(echo $AUTH_URL | grep -o 'redirect_uri=[^&]*' | cut -d'=' -f2 | python3 -c 'import sys; from urllib.parse import unquote; print(unquote(sys.stdin.read().strip()))')"
echo "  Scopes:        $(echo $AUTH_URL | grep -o 'scope=[^&]*' | cut -d'=' -f2 | python3 -c 'import sys; from urllib.parse import unquote; print(unquote(sys.stdin.read().strip()))')"
echo "  Response Type: $(echo $AUTH_URL | grep -o 'response_type=[^&]*' | cut -d'=' -f2)"
echo ""

# リダイレクトURIの検証
REDIRECT_URI=$(echo $AUTH_URL | grep -o 'redirect_uri=[^&]*' | cut -d'=' -f2 | python3 -c 'import sys; from urllib.parse import unquote; print(unquote(sys.stdin.read().strip()))')
EXPECTED_REDIRECT="http://localhost:3002/api/auth/callback"

echo "🔍 リダイレクトURI検証:"
echo ""
echo "  期待値: $EXPECTED_REDIRECT"
echo "  実際値: $REDIRECT_URI"

if [ "$REDIRECT_URI" = "$EXPECTED_REDIRECT" ]; then
    echo "  ✅ 一致しています"
else
    echo "  ❌ 不一致です"
fi
echo ""

# 次のステップを表示
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 次のステップ:"
echo ""
echo "1. Meta Developer Dashboard で以下のURIを設定:"
echo "   $EXPECTED_REDIRECT"
echo ""
echo "2. 上記の認証URLをブラウザで開く"
echo ""
echo "3. Threadsアカウントでログインして承認"
echo ""
echo "4. コールバック後、ダッシュボードでアカウント情報を確認"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 認証URLをクリップボードにコピー（macOSの場合）
if command -v pbcopy &> /dev/null; then
    echo "$AUTH_URL" | pbcopy
    echo "📋 認証URLをクリップボードにコピーしました"
    echo ""
fi

# ブラウザで開くか確認
echo "🌐 認証URLをブラウザで開きますか? (y/n)"
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    if command -v open &> /dev/null; then
        open "$AUTH_URL"
        echo "✅ ブラウザで開きました"
    else
        echo "ℹ️  手動で上記URLをブラウザで開いてください"
    fi
fi

echo ""
echo "✨ テスト完了"
