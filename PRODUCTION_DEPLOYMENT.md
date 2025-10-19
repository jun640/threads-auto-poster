# 本番環境デプロイ完全ガイド

このガイドでは、Threads Auto Posterを本番環境（Vercel）にデプロイするための完全な手順を説明します。

---

## 📋 目次

1. [事前準備](#事前準備)
2. [データベースのセットアップ](#データベースのセットアップ)
3. [Vercelプロジェクトの作成](#vercelプロジェクトの作成)
4. [環境変数の設定](#環境変数の設定)
5. [Meta Developer設定の更新](#meta-developer設定の更新)
6. [初回デプロイ](#初回デプロイ)
7. [データベースマイグレーション](#データベースマイグレーション)
8. [動作確認](#動作確認)
9. [Cron設定](#cron設定)
10. [トラブルシューティング](#トラブルシューティング)

---

## 1. 事前準備

### ✅ 必要なアカウント

以下のアカウントを用意してください:

- [x] **GitHub アカウント**
- [x] **Vercel アカウント** (GitHubで登録可能)
- [x] **Meta Developer アカウント**
- [x] **OpenAI アカウント** (APIキー取得済み)
- [x] **Google Cloud アカウント** (Gemini APIキー取得済み、オプション)

### ✅ コードの準備

1. **GitHubリポジトリを作成**
   ```bash
   # プロジェクトディレクトリで実行
   git init
   git add .
   git commit -m "Initial commit: Threads Auto Poster"

   # GitHubでリポジトリ作成後
   git remote add origin https://github.com/YOUR_USERNAME/threads-auto-poster.git
   git push -u origin main
   ```

2. **.gitignore の確認**
   ```bash
   # 以下が含まれていることを確認
   cat .gitignore
   ```

   必須項目:
   ```
   .env
   .env.local
   node_modules
   .next
   prisma/dev.db
   prisma/dev.db-journal
   ```

---

## 2. データベースのセットアップ

本番環境ではSQLiteではなくPostgreSQLを使用します。

### オプション1: Vercel Postgres（推奨）

1. **Vercelダッシュボードで設定**
   - プロジェクトを作成後、「Storage」タブ
   - 「Create Database」→「Postgres」を選択
   - データベース名を入力（例: `threads-auto-poster-db`）
   - リージョンを選択（例: `us-east-1`）
   - 「Create」をクリック

2. **自動的に環境変数が設定されます**
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`

### オプション2: Supabase（無料枠あり）

1. **Supabaseプロジェクト作成**
   - https://supabase.com にアクセス
   - 「New Project」をクリック
   - プロジェクト名、データベースパスワードを設定
   - リージョンを選択

2. **接続文字列を取得**
   - Settings → Database
   - Connection string → URI をコピー
   - パスワード部分を実際のパスワードに置き換え

### オプション3: Railway（簡単セットアップ）

```bash
# Railwayプロジェクト作成
railway login
railway init
railway add postgresql
railway link
```

---

## 3. Vercelプロジェクトの作成

### 方法1: Vercel CLI（推奨）

```bash
# Vercel CLIをインストール
npm i -g vercel

# プロジェクトをVercelにリンク
vercel

# プロンプトに従って設定
# - Set up and deploy? Yes
# - Which scope? (あなたのアカウント)
# - Link to existing project? No
# - What's your project's name? threads-auto-poster
# - In which directory is your code located? ./
# - Want to override the settings? No
```

### 方法2: Vercel Dashboard

1. https://vercel.com/new にアクセス
2. GitHubリポジトリをインポート
3. プロジェクト名を設定
4. Framework Preset: **Next.js**
5. Root Directory: `./`
6. Build Command: `npm run build`
7. Output Directory: `.next`

---

## 4. 環境変数の設定

### 📝 必須環境変数リスト

Vercelダッシュボードで以下を設定:

#### Threads API設定
```env
THREADS_APP_ID=your_app_id_here
THREADS_APP_SECRET=your_app_secret_here
THREADS_REDIRECT_URI=https://your-domain.vercel.app/api/auth/callback
```

#### AI API設定
```env
OPENAI_API_KEY=sk-your-openai-api-key
GEMINI_API_KEY=your-gemini-api-key
```

#### データベース設定
```env
# Vercel Postgresの場合（自動設定）
POSTGRES_URL="postgres://..."
POSTGRES_PRISMA_URL="postgres://..."
POSTGRES_URL_NON_POOLING="postgres://..."

# または手動で設定
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
```

### Vercel Dashboardでの設定方法

1. プロジェクトダッシュボード → Settings → Environment Variables
2. 各変数を追加:
   - **Name**: 変数名（例: `THREADS_APP_ID`）
   - **Value**: 値
   - **Environment**: Production, Preview, Development すべてチェック
3. 「Add」をクリック

### CLIでの一括設定

```bash
# .env.production ファイルを作成
cat > .env.production << 'EOF'
THREADS_APP_ID=your_app_id
THREADS_APP_SECRET=your_app_secret
THREADS_REDIRECT_URI=https://your-domain.vercel.app/api/auth/callback
OPENAI_API_KEY=sk-your-key
GEMINI_API_KEY=your-key
DATABASE_URL=postgresql://...
EOF

# Vercelに一括アップロード
vercel env pull .env.local
# 手動で.env.productionの内容をコピー
```

---

## 5. Meta Developer設定の更新

### Threads API設定

1. **Meta Developer Dashboardにアクセス**
   - https://developers.facebook.com/apps/YOUR_APP_ID

2. **製品 → Threads → 設定**

3. **リダイレクトURIを追加**
   ```
   https://your-domain.vercel.app/api/auth/callback
   ```

   複数の環境用に追加可能:
   ```
   https://your-domain.vercel.app/api/auth/callback
   https://your-domain-preview.vercel.app/api/auth/callback
   http://localhost:3000/api/auth/callback
   ```

4. **保存**

---

## 6. 初回デプロイ

### Vercel CLIでデプロイ

```bash
# 本番環境にデプロイ
vercel --prod

# デプロイ完了後、URLが表示されます
# ✅ Production: https://threads-auto-poster.vercel.app
```

### 自動デプロイ設定

GitHubと連携している場合、以下が自動的に行われます:

- `main`ブランチへのpush → **本番環境**にデプロイ
- その他のブランチへのpush → **プレビュー環境**にデプロイ
- Pull Request作成 → **プレビュー環境**を自動生成

---

## 7. データベースマイグレーション

### Prismaスキーマの更新

1. **prisma/schema.prismaを確認**
   ```prisma
   datasource db {
     provider = "postgresql"  // SQLiteから変更
     url      = env("DATABASE_URL")
   }
   ```

2. **マイグレーション実行**
   ```bash
   # ローカルでマイグレーションファイル生成
   npx prisma migrate dev --name init

   # Vercel環境でマイグレーション実行
   vercel env pull .env.local
   DATABASE_URL="your_postgres_url" npx prisma migrate deploy

   # または、Vercel上で実行
   # Project Settings → General → Build & Development Settings
   # Install Command: npm install && npx prisma generate && npx prisma migrate deploy
   ```

3. **Prisma Clientを生成**
   ```bash
   npx prisma generate
   ```

### package.jsonにビルドスクリプト追加

```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build",
    "vercel-build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

---

## 8. 動作確認

### 基本機能のチェックリスト

デプロイ後、以下を確認してください:

- [ ] **サイトが表示される**
  - `https://your-domain.vercel.app` にアクセス

- [ ] **Threads認証が動作する**
  - 「Threadsと連携する」ボタンをクリック
  - Meta認証画面が表示される
  - リダイレクトが正常に動作する

- [ ] **投稿生成が動作する**
  - 投稿を生成タブで投稿を生成
  - エラーが発生しない

- [ ] **データベース接続が正常**
  - 投稿一覧が表示される
  - データが保存される

- [ ] **設定が保存される**
  - 設定タブで基本プロンプトを保存
  - リロード後も保持される

### ログの確認

```bash
# Vercelログを確認
vercel logs

# リアルタイムログ
vercel logs --follow

# エラーログのみ
vercel logs --output=errors
```

---

## 9. Cron設定

### Vercel Cronの設定

`vercel.json`はすでに作成済みですが、確認:

```json
{
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

### Cron保護の追加（推奨）

cronエンドポイントを保護するため、認証を追加:

```typescript
// app/api/cron/publish/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Vercel Cronからのリクエストを検証
  const authHeader = request.headers.get('authorization')

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 既存の処理...
}
```

環境変数に追加:
```env
CRON_SECRET=your_random_secret_here
```

---

## 10. トラブルシューティング

### よくある問題と解決方法

#### 問題1: ビルドエラー "Prisma Client not generated"

**解決方法:**
```bash
# package.jsonに追加
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

#### 問題2: データベース接続エラー

**原因:** DATABASE_URLが正しく設定されていない

**解決方法:**
1. Vercelダッシュボードで環境変数を確認
2. `?sslmode=require` が付いているか確認
3. Prisma接続をテスト:
   ```bash
   DATABASE_URL="your_url" npx prisma db pull
   ```

#### 問題3: 環境変数が反映されない

**解決方法:**
1. Vercelダッシュボードで再確認
2. 再デプロイ:
   ```bash
   vercel --prod --force
   ```

#### 問題4: Threads APIエラー "Invalid redirect URI"

**解決方法:**
1. Meta Developer Dashboardで正確なURLを確認
2. 大文字小文字、末尾スラッシュを確認
3. HTTPSであることを確認

#### 問題5: Cronが実行されない

**解決方法:**
1. `vercel.json`が正しいか確認
2. Vercel Proプラン（Hobbyプランは制限あり）
3. ログを確認:
   ```bash
   vercel logs --output=errors
   ```

---

## 📊 パフォーマンス最適化

### 推奨設定

1. **データベースコネクションプーリング**
   ```env
   DATABASE_URL="postgresql://...?connection_limit=10&pool_timeout=10"
   ```

2. **Next.js設定最適化**
   ```javascript
   // next.config.js
   module.exports = {
     experimental: {
       serverActions: true,
     },
     images: {
       domains: ['scontent.cdninstagram.com'],
     },
   }
   ```

3. **APIレート制限**
   - OpenAI APIのレート制限に注意
   - 必要に応じてキャッシュを実装

---

## 🔒 セキュリティチェックリスト

- [ ] 環境変数が`.env`ファイルに含まれていない
- [ ] `.gitignore`が正しく設定されている
- [ ] APIキーがGitHubにコミットされていない
- [ ] Cronエンドポイントが保護されている
- [ ] HTTPSが有効（Vercelは自動）
- [ ] データベース接続がSSL/TLS
- [ ] エラーメッセージに機密情報が含まれていない

---

## 📝 デプロイ後のチェックリスト

### 初回デプロイ完了後

- [ ] サイトにアクセスできる
- [ ] Threads認証が動作する
- [ ] 投稿生成が動作する
- [ ] データベースに保存できる
- [ ] 設定が保存される
- [ ] 自動投稿ルールが作成できる
- [ ] Cronが実行される（5分待つ）
- [ ] ログにエラーがない

### 定期的なメンテナンス

- [ ] 週次: ログを確認
- [ ] 月次: データベースのバックアップ
- [ ] 月次: 依存パッケージの更新確認
- [ ] 四半期: セキュリティ監査

---

## 🎉 完了！

本番環境へのデプロイが完了しました。

### 次のステップ

1. **カスタムドメインの設定**（オプション）
   - Vercel Dashboard → Domains
   - カスタムドメインを追加

2. **監視の設定**
   - Vercel Analytics を有効化
   - エラー通知の設定

3. **ユーザーへの案内**
   - 使用方法のドキュメント共有
   - サポート体制の準備

---

## 📚 関連ドキュメント

- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Threads API Documentation](https://developers.facebook.com/docs/threads)

---

**何か問題が発生した場合:**
1. このガイドのトラブルシューティングセクションを確認
2. Vercelログを確認
3. GitHubでIssueを作成
