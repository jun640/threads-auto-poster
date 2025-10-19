# Vercel デプロイ完全手順書

Threads Auto PosterをVercelに本番デプロイするための詳細な手順書です。

---

## 📋 目次

1. [事前確認](#事前確認)
2. [GitHubリポジトリの準備](#githubリポジトリの準備)
3. [Vercelプロジェクトの作成](#vercelプロジェクトの作成)
4. [環境変数の設定](#環境変数の設定)
5. [データベースのセットアップ](#データベースのセットアップ)
6. [初回デプロイ](#初回デプロイ)
7. [カスタムドメイン設定](#カスタムドメイン設定オプション)
8. [継続的デプロイの設定](#継続的デプロイの設定)
9. [モニタリングとログ](#モニタリングとログ)
10. [トラブルシューティング](#トラブルシューティング)

---

## 1. 事前確認

### ✅ 必要なアカウント

以下のアカウントを事前に作成してください:

- [ ] **GitHubアカウント**
  - https://github.com/signup

- [ ] **Vercelアカウント**
  - https://vercel.com/signup
  - GitHubアカウントでサインアップ推奨

- [ ] **Meta Developerアカウント**
  - https://developers.facebook.com

- [ ] **OpenAIアカウント**
  - https://platform.openai.com
  - APIキー取得済み

### ✅ ローカル環境の確認

```bash
# Node.jsバージョン確認（18.x以上推奨）
node --version
# v18.0.0 以上

# npmバージョン確認
npm --version

# gitが利用可能か確認
git --version

# プロジェクトディレクトリに移動
cd /path/to/threads-auto-poster

# ローカルでビルドが通ることを確認
npm run build
```

---

## 2. GitHubリポジトリの準備

### ステップ1: .gitignoreの確認

```bash
# .gitignoreファイルを確認
cat .gitignore
```

**必須エントリー:**
```gitignore
# 依存関係
node_modules/
.pnp
.pnp.js

# 環境変数
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env.production

# Next.js
.next/
out/
build/
dist/

# データベース
prisma/dev.db
prisma/dev.db-journal
*.db
*.db-journal

# ログ
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.idea/
.vscode/
*.swp
*.swo

# macOS
.DS_Store

# Vercel
.vercel
```

### ステップ2: Gitリポジトリの初期化

```bash
# まだGitリポジトリでない場合
git init

# 全ファイルを追加
git add .

# 初回コミット
git commit -m "Initial commit: Threads Auto Poster"
```

### ステップ3: GitHubリポジトリの作成

#### 方法A: GitHub CLI（推奨）

```bash
# GitHub CLIをインストール（macOS）
brew install gh

# GitHubにログイン
gh auth login

# リポジトリを作成してpush
gh repo create threads-auto-poster --public --source=. --remote=origin --push
```

#### 方法B: GitHub Web UI

1. **GitHub.comでリポジトリ作成**
   - https://github.com/new にアクセス
   - Repository name: `threads-auto-poster`
   - Description: `Threads投稿を自動生成・投稿するツール`
   - Public または Private を選択
   - 「Create repository」をクリック

2. **ローカルからpush**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/threads-auto-poster.git
   git branch -M main
   git push -u origin main
   ```

### ステップ4: リポジトリの確認

```bash
# リモートリポジトリを確認
git remote -v

# 出力例:
# origin  https://github.com/YOUR_USERNAME/threads-auto-poster.git (fetch)
# origin  https://github.com/YOUR_USERNAME/threads-auto-poster.git (push)
```

---

## 3. Vercelプロジェクトの作成

### 方法A: Vercel CLI（推奨・高速）

#### Vercel CLIのインストール

```bash
# グローバルにインストール
npm install -g vercel

# Vercelにログイン
vercel login
```

#### プロジェクトのセットアップ

```bash
# プロジェクトディレクトリで実行
vercel

# インタラクティブプロンプトに回答:
```

**プロンプトの回答例:**
```
? Set up and deploy "~/projects/threads/auto-poster"? [Y/n]
→ Y

? Which scope do you want to deploy to?
→ (あなたのアカウント名を選択)

? Link to existing project? [y/N]
→ N

? What's your project's name?
→ threads-auto-poster

? In which directory is your code located?
→ ./

? Want to modify these settings? [y/N]
→ N
```

**設定内容の確認:**
```
Auto-detected Project Settings (Next.js):
- Build Command: next build
- Output Directory: .next
- Development Command: next dev --port $PORT
```

#### 初回デプロイ（プレビュー環境）

```bash
# 自動的にデプロイが開始されます
# デプロイ完了後、プレビューURLが表示されます

# 例:
# ✅ Preview: https://threads-auto-poster-abc123.vercel.app
```

---

### 方法B: Vercel Dashboard（GUI）

#### ステップ1: Vercel Dashboardにアクセス

https://vercel.com/new にアクセス

#### ステップ2: GitHubリポジトリをインポート

1. **「Import Git Repository」をクリック**

2. **GitHubアカウントを連携**
   - 「Continue with GitHub」をクリック
   - 権限を許可

3. **リポジトリを選択**
   - `threads-auto-poster` を検索
   - 「Import」をクリック

#### ステップ3: プロジェクト設定

**Configure Project 画面で設定:**

| 項目 | 値 |
|------|-----|
| **Project Name** | `threads-auto-poster` |
| **Framework Preset** | Next.js（自動検出） |
| **Root Directory** | `./` |
| **Build Command** | `npm run build` |
| **Output Directory** | `.next` |
| **Install Command** | `npm install` |

**環境変数は後で設定するため、ここではスキップ**

4. **「Deploy」をクリック**

---

## 4. 環境変数の設定

### Vercel Dashboardでの設定

1. **プロジェクトダッシュボードにアクセス**
   ```
   https://vercel.com/your-username/threads-auto-poster
   ```

2. **Settings → Environment Variables に移動**

3. **以下の環境変数を1つずつ追加**

#### Threads API設定

```env
Name: THREADS_APP_ID
Value: your_meta_app_id
Environment: Production, Preview, Development (全てチェック)
```

```env
Name: THREADS_APP_SECRET
Value: your_meta_app_secret
Environment: Production, Preview, Development
```

```env
Name: THREADS_REDIRECT_URI
Value: https://your-app.vercel.app/api/auth/callback
Environment: Production
```

**Preview/Development用のリダイレクトURI:**
```env
Name: THREADS_REDIRECT_URI
Value: https://your-app-preview.vercel.app/api/auth/callback
Environment: Preview

Name: THREADS_REDIRECT_URI
Value: http://localhost:3000/api/auth/callback
Environment: Development
```

#### AI API設定

```env
Name: OPENAI_API_KEY
Value: sk-proj-your-openai-api-key
Environment: Production, Preview, Development
```

```env
Name: GEMINI_API_KEY
Value: your-gemini-api-key
Environment: Production, Preview, Development
```

#### セキュリティ設定

```bash
# ターミナルでランダム文字列を生成
openssl rand -base64 32
```

```env
Name: CRON_SECRET
Value: (上で生成した文字列)
Environment: Production, Preview
```

### Vercel CLIでの設定

```bash
# 対話的に環境変数を追加
vercel env add THREADS_APP_ID
# → Value を入力
# → Environment を選択 (Production, Preview, Development)

# 一括設定用スクリプト
vercel env add THREADS_APP_SECRET
vercel env add THREADS_REDIRECT_URI
vercel env add OPENAI_API_KEY
vercel env add GEMINI_API_KEY
vercel env add CRON_SECRET
```

### 環境変数の確認

```bash
# 設定済み環境変数を確認
vercel env ls

# 本番環境のみ表示
vercel env ls --environment production

# ローカルに環境変数をpull
vercel env pull .env.local
```

---

## 5. データベースのセットアップ

### Vercel Postgresの作成

#### ステップ1: Storageタブに移動

```
プロジェクトダッシュボード → Storage タブ
```

#### ステップ2: Create Database

1. **「Create Database」をクリック**
2. **「Postgres」を選択**

#### ステップ3: データベース設定

| 項目 | 値 |
|------|-----|
| **Database Name** | `threads-auto-poster-db` |
| **Region** | `Washington, D.C., USA (iad1)` または最寄り |

4. **「Create」をクリック**

#### ステップ4: プロジェクトにリンク

1. **「Connect Project」をクリック**
2. **`threads-auto-poster` プロジェクトを選択**
3. **環境を選択: Production, Preview, Development**
4. **「Connect」をクリック**

#### ステップ5: 環境変数の自動設定を確認

Settings → Environment Variables で以下が追加されていることを確認:

- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

---

## 6. 初回デプロイ

### ステップ1: ビルド設定の確認

**package.json を確認:**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && prisma migrate deploy && next build",
    "start": "next start",
    "lint": "next lint",
    "vercel-build": "prisma generate && prisma migrate deploy && next build",
    "postinstall": "prisma generate"
  }
}
```

**重要:** `prisma generate` と `prisma migrate deploy` がビルドスクリプトに含まれている必要があります。

### ステップ2: 本番環境にデプロイ

#### Vercel CLIの場合

```bash
# 本番環境にデプロイ
vercel --prod

# デプロイ進捗を確認
# ✓ Building
# ✓ Deploying
# ✓ Running Checks
# ✅ Production: https://threads-auto-poster.vercel.app
```

#### GitHub連携の場合

```bash
# mainブランチにpush
git add .
git commit -m "feat: ready for production deployment"
git push origin main

# Vercelが自動的にデプロイを開始
# ダッシュボードで進捗を確認
```

### ステップ3: デプロイの確認

```bash
# ログをリアルタイム監視
vercel logs --follow

# エラーがないか確認
vercel logs --output=errors
```

### ステップ4: Meta Developer設定の更新

1. **Meta Developer Dashboardにアクセス**
   ```
   https://developers.facebook.com/apps/YOUR_APP_ID
   ```

2. **Threads → 設定 に移動**

3. **リダイレクトURIを追加**
   ```
   https://threads-auto-poster.vercel.app/api/auth/callback
   ```

   **複数環境対応:**
   ```
   https://threads-auto-poster.vercel.app/api/auth/callback
   https://threads-auto-poster-git-main-username.vercel.app/api/auth/callback
   http://localhost:3000/api/auth/callback
   ```

4. **変更を保存**

---

## 7. カスタムドメイン設定（オプション）

### 独自ドメインを設定する場合

#### ステップ1: ドメインを追加

```
プロジェクトダッシュボード → Settings → Domains
```

1. **「Add」をクリック**
2. **ドメイン名を入力**
   ```
   例: threads.yourdomain.com
   ```
3. **「Add」をクリック**

#### ステップ2: DNS設定

Vercelが表示するDNSレコードをドメインレジストラで設定:

**Aレコードの場合:**
```
Type: A
Name: threads (またはサブドメイン名)
Value: 76.76.21.21
```

**CNAMEレコードの場合:**
```
Type: CNAME
Name: threads
Value: cname.vercel-dns.com
```

#### ステップ3: SSL証明書の発行

Vercelが自動的にLet's EncryptでSSL証明書を発行します（数分〜数時間）

#### ステップ4: Meta Developer設定を更新

リダイレクトURIにカスタムドメインを追加:
```
https://threads.yourdomain.com/api/auth/callback
```

---

## 8. 継続的デプロイの設定

### Git連携による自動デプロイ

Vercelは自動的に以下のワークフローを設定します:

#### ブランチ別デプロイ

| ブランチ | 環境 | URL |
|----------|------|-----|
| `main` | **Production** | `https://threads-auto-poster.vercel.app` |
| `dev` | Preview | `https://threads-auto-poster-git-dev-username.vercel.app` |
| `feature-*` | Preview | `https://threads-auto-poster-git-feature-xxx.vercel.app` |

#### Pull Request プレビュー

```bash
# 新機能ブランチを作成
git checkout -b feature/new-ai-model

# 変更をcommit & push
git add .
git commit -m "feat: add new AI model support"
git push origin feature/new-ai-model

# GitHubでPull Requestを作成
# → Vercelが自動的にプレビュー環境を作成
# → PRコメントにプレビューURLが追加される
```

### デプロイ設定のカスタマイズ

**vercel.json:**

```json
{
  "buildCommand": "npm run vercel-build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "crons": [
    {
      "path": "/api/cron/publish",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/auto-post",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

---

## 9. モニタリングとログ

### Vercel Analyticsの有効化

```
プロジェクトダッシュボード → Analytics → Enable
```

**無料プランで利用可能:**
- ページビュー
- ユニーク訪問者
- トップページ
- リファラー

### ログの確認

```bash
# リアルタイムログ
vercel logs --follow

# 過去のログ
vercel logs

# エラーのみ表示
vercel logs --output=errors

# 特定のデプロイメントのログ
vercel logs [deployment-url]
```

### Webhookの設定

```
Settings → Git → Deploy Hooks
```

外部サービスと連携してデプロイ通知を受け取る:
- Slack
- Discord
- Email

---

## 10. トラブルシューティング

### 問題1: ビルドエラー "Module not found"

**原因:** 依存関係の不足

**解決方法:**
```bash
# package.jsonを確認
npm install

# Vercel側のnode_modulesをクリア
vercel env rm NODE_ENV
vercel --force
```

### 問題2: "Prisma Client not generated"

**原因:** postinstallスクリプトが実行されていない

**解決方法:**

**package.json:**
```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "vercel-build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

再デプロイ:
```bash
git add package.json
git commit -m "fix: add postinstall script"
git push
```

### 問題3: 環境変数が反映されない

**原因:** 環境変数の設定後に再デプロイが必要

**解決方法:**
```bash
# 強制再デプロイ
vercel --prod --force

# または空コミット
git commit --allow-empty -m "chore: redeploy"
git push
```

### 問題4: データベース接続エラー

**原因:** DATABASE_URLが正しく設定されていない

**解決方法:**

1. **環境変数を確認:**
   ```bash
   vercel env ls
   ```

2. **Vercel Postgresの場合、正しい変数を使用:**
   ```
   POSTGRES_PRISMA_URL （推奨）
   ```

3. **prisma/schema.prisma を確認:**
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("POSTGRES_PRISMA_URL")
   }
   ```

### 問題5: Cron Jobが実行されない

**原因:** Vercel Hobby プランではCronに制限あり

**解決方法:**

1. **vercel.json を確認:**
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/publish",
         "schedule": "*/5 * * * *"
       }
     ]
   }
   ```

2. **Proプランにアップグレード（必要な場合）**

3. **外部Cronサービスを利用:**
   - [cron-job.org](https://cron-job.org)
   - [EasyCron](https://www.easycron.com)

### 問題6: "Too Many Requests" エラー

**原因:** APIレート制限

**解決方法:**

```typescript
// lib/rate-limit.ts
import { LRUCache } from 'lru-cache'

const ratelimit = new LRUCache({
  max: 500,
  ttl: 60000, // 1分
})

export function checkRateLimit(ip: string) {
  const tokenCount = (ratelimit.get(ip) as number) || 0

  if (tokenCount > 10) {
    return false
  }

  ratelimit.set(ip, tokenCount + 1)
  return true
}
```

---

## ✅ デプロイ完了チェックリスト

### 事前準備
- [ ] GitHubリポジトリ作成済み
- [ ] Vercelアカウント作成済み
- [ ] ローカルでビルド成功

### Vercel設定
- [ ] プロジェクト作成完了
- [ ] 環境変数すべて設定済み
- [ ] データベース接続済み
- [ ] カスタムドメイン設定済み（オプション）

### デプロイ
- [ ] 本番環境にデプロイ成功
- [ ] サイトにアクセス可能
- [ ] SSL証明書有効

### 動作確認
- [ ] Threads認証が動作
- [ ] 投稿生成が動作
- [ ] データベース保存が動作
- [ ] Cron Jobが実行される

### Meta Developer
- [ ] リダイレクトURI登録済み
- [ ] OAuth認証が動作

---

## 📚 参考リンク

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [Vercel Postgres Documentation](https://vercel.com/docs/storage/vercel-postgres)

---

**Vercelデプロイが完了しました！** 🎉

次のステップ: [セキュリティ設定チェックリスト](./SECURITY_CHECKLIST.md)
