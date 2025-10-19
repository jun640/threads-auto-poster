# Threads Auto Poster - セットアップ進捗状況

## 📅 最終更新日: 2024年10月17日

---

## ✅ 完了したタスク

### 1. Meta Developer アプリ作成
- ✅ Meta Developer アカウント作成完了
- ✅ Threads Auto Poster アプリ作成完了
- ✅ ユースケース: **Threads APIにアクセス** を選択
- ✅ ビジネスポートフォリオ: リンクなし（個人開発用）

### 2. 認証情報取得
- ✅ **ThreadsアプリID**: `1554440308880133`
- ✅ **Threadsのapp secret**: `2cee66d7017838ae8d4c78ab71f87e9c`
- ✅ `.env`ファイルに設定済み

### 3. アプリケーション動作確認
- ✅ 開発モード (`?dev=true`) で正常動作
- ✅ AI投稿生成機能（OpenAI GPT-4 & Gemini）動作確認済み
- ✅ 競合分析機能動作確認済み
- ✅ 複数アカウント管理機能動作確認済み
- ✅ カスタムプロンプト（基本+追加）機能動作確認済み

---

## ⚠️ 未完了のタスク

### 1. OAuthリダイレクトURI設定（最重要）

**問題点:**
Meta Developer DashboardでOAuthリダイレクトURIの保存ができない状態

**エラー詳細:**
- Threads APIの「カスタマイズ」画面で保存を試みるとエラー
- エラーメッセージ: 「Redirect URIs: OAuthリダイレクトURIを記入してください」
- エラーコード: `1349187`

**必要な設定:**
- **有効なOAuthリダイレクトURI**: `http://localhost:3000/api/auth/callback`
- **コールバックURLをアンインストール**: `https://example.com/deauthorize` （ダミー）
- **コールバックURLを削除**: `https://example.com/data-deletion` （ダミー）

**次回試す解決策:**

#### 方法1: アプリ設定の「ベーシック」から設定
1. Meta Developer Dashboard → 左サイドバー「アプリの設定」→「ベーシック」
2. 下にスクロール → 「+ プラットフォームを追加」
3. 「ウェブサイト」を選択
4. サイトURL: `http://localhost:3000`
5. 保存

#### 方法2: Threads製品設定から直接設定
1. 左サイドバー「製品」→「Threads」
2. 「設定」タブ
3. 「有効なOAuthリダイレクトURI」に `http://localhost:3000/api/auth/callback` を追加
4. 保存

#### 方法3: Meta開発者サポートに問い合わせ
- OAuthリダイレクトURIが保存できない問題を報告

---

## 📂 現在の環境変数設定 (.env)

```bash
# OpenAI API Key
OPENAI_API_KEY=sk-your-openai-api-key-here

# Google Gemini API Key
GEMINI_API_KEY=AIzaSyBJeTTwD8AmR21SYBGbFN0I6qqz_tsMOvs

# Threads API Configuration
THREADS_APP_ID=1554440308880133
THREADS_APP_SECRET=2cee66d7017838ae8d4c78ab71f87e9c
THREADS_REDIRECT_URI=http://localhost:3000/api/auth/callback

# Database
DATABASE_URL=file:./dev.db
```

---

## 🚀 アプリケーションの起動方法

### 開発サーバーの起動
```bash
cd /Users/soumajun/projects/threads/auto-poster
npm run dev
```

### アクセスURL

#### 開発モード（認証不要）
```
http://localhost:3000/dashboard?dev=true
```

#### 本番モード（Threads認証必要）
```
http://localhost:3000/dashboard
```

#### セットアップガイド
```
http://localhost:3000/setup
```

---

## 🎯 次回やること

### 優先度: 高
1. **OAuthリダイレクトURIの設定を完了**
   - 上記の「方法1」「方法2」を試す
   - 成功したら実際のThreads認証フローをテスト

2. **完全なApp Secretの確認**
   - Meta Developer Dashboardで「表示」をクリック
   - 完全な値が`.env`と一致しているか確認

### 優先度: 中
3. **実際のThreads投稿テスト**
   - OAuth認証成功後
   - 実際のThreadsアカウントで投稿できるか確認

4. **本番環境へのデプロイ準備**
   - Vercel または Netlify でのデプロイ
   - PostgreSQL データベースのセットアップ
   - 本番用のOAuthリダイレクトURI設定

---

## 📝 重要なメモ

### Meta Developer Dashboard情報
- **アプリ名**: Threads Auto Poster
- **アプリID**: 1554440308880133
- **アプリURL**: https://developers.facebook.com/apps/1554440308880133
- **アプリモード**: 開発モード

### トラブルシューティング

#### 開発モードの解除方法
```javascript
// ブラウザのコンソールで実行
localStorage.removeItem('dev_mode')
location.reload()
```

#### または、シークレットモードで開く
```
Cmd+Shift+N (Mac) / Ctrl+Shift+N (Windows)
```

---

## 🔗 参考リンク

- [Meta Developer Dashboard](https://developers.facebook.com/)
- [Threads API ドキュメント](https://developers.facebook.com/docs/threads)
- [プロジェクトセットアップガイド](http://localhost:3000/setup)
- [.env.example](file:///Users/soumajun/projects/threads/auto-poster/.env.example)

---

## 📊 現在の機能状況

### ✅ 動作中の機能（開発モード）
- AI投稿生成（OpenAI GPT-4）
- AI投稿生成（Google Gemini 2.5 Flash）
- 競合アカウント分析
- バズる投稿の自動生成
- 複数アカウント管理（4つ以上対応）
- 基本プロンプト + カスタムプロンプト
- 投稿一覧・編集・削除
- スケジュール投稿（UIのみ）
- アナリティクス（カスタム期間対応）
- ダークモード対応

### ❌ 未実装の機能
- 実際のThreadsへの投稿（OAuth設定待ち）
- 実際のThreadsからのインサイト取得（OAuth設定待ち）

---

**次回は、OAuthリダイレクトURIの設定から再開してください！**
