# 本番環境デプロイ マスターガイド

Threads Auto Posterを本番環境にデプロイするための統合ガイドです。

---

## 🎯 このガイドについて

このマスターガイドは、本番環境へのデプロイに必要なすべての情報を統合し、ステップバイステップで実装を進められるようにまとめたものです。

### 📚 関連ドキュメント

本デプロイガイドは以下の詳細ドキュメントと連携しています:

| ドキュメント | 内容 | 用途 |
|-------------|------|------|
| [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) | 本番環境デプロイ完全ガイド | 全体像の把握 |
| [ENV_CHECKLIST.md](./ENV_CHECKLIST.md) | 環境変数チェックリスト | 環境変数設定時の参照 |
| [DATABASE_MIGRATION_GUIDE.md](./DATABASE_MIGRATION_GUIDE.md) | データベース移行ガイド | DB移行時の参照 |
| [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) | Vercelデプロイ手順書 | Vercel設定時の参照 |
| [SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md) | セキュリティチェックリスト | セキュリティ確認時の参照 |

---

## 📋 デプロイフロー概要

```
┌─────────────────────────────────────────────────────────────┐
│                     事前準備（1-2時間）                        │
├─────────────────────────────────────────────────────────────┤
│ 1. アカウント作成                                              │
│    - GitHub, Vercel, Meta Developer, OpenAI                 │
│ 2. ローカル環境確認                                            │
│    - ビルド成功、動作確認                                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   リポジトリ準備（30分）                        │
├─────────────────────────────────────────────────────────────┤
│ 1. GitHubリポジトリ作成                                        │
│ 2. .gitignore確認                                            │
│ 3. コードをpush                                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  データベース準備（30分）                        │
├─────────────────────────────────────────────────────────────┤
│ 1. PostgreSQLセットアップ                                     │
│    - Vercel Postgres（推奨）                                  │
│ 2. 接続文字列取得                                              │
│ 3. スキーマ更新（sqlite → postgresql）                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Vercel設定（1時間）                          │
├─────────────────────────────────────────────────────────────┤
│ 1. プロジェクト作成                                            │
│ 2. 環境変数設定（15個程度）                                     │
│ 3. ビルド設定確認                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    初回デプロイ（30分）                         │
├─────────────────────────────────────────────────────────────┤
│ 1. vercel --prod 実行                                         │
│ 2. マイグレーション実行確認                                      │
│ 3. デプロイURL取得                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│               Meta Developer設定（15分）                       │
├─────────────────────────────────────────────────────────────┤
│ 1. リダイレクトURI登録                                          │
│ 2. OAuth設定確認                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    動作確認（30分）                            │
├─────────────────────────────────────────────────────────────┤
│ 1. サイトアクセス                                              │
│ 2. 認証テスト                                                 │
│ 3. 投稿生成・保存テスト                                         │
│ 4. Cronジョブ確認                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│               セキュリティ確認（30分）                          │
├─────────────────────────────────────────────────────────────┤
│ 1. HTTPS確認                                                 │
│ 2. 環境変数保護確認                                            │
│ 3. Cronジョブ保護確認                                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
                        完了！ 🎉
```

**総所要時間: 約5-6時間**

---

## 🚀 クイックスタート（経験者向け）

すでにVercelやNext.jsデプロイの経験がある方向けの簡潔な手順です。

### 1分で確認

```bash
# 1. GitHubにpush
git init && git add . && git commit -m "Initial commit"
gh repo create threads-auto-poster --public --source=. --push

# 2. Vercelデプロイ
npm i -g vercel
vercel login
vercel --prod

# 3. Vercel Postgres作成
# Dashboard → Storage → Create Database → Postgres

# 4. 環境変数設定（Dashboard）
# THREADS_APP_ID, THREADS_APP_SECRET, THREADS_REDIRECT_URI
# OPENAI_API_KEY, GEMINI_API_KEY, CRON_SECRET

# 5. Meta Developerでリダイレクト URI登録
# https://your-app.vercel.app/api/auth/callback

# 6. 再デプロイ
vercel --prod --force
```

---

## 📖 詳細ステップバイステップガイド

### ステップ1: 事前準備 ✅

#### 必要なアカウント

- [ ] **GitHub** - コード管理
  - https://github.com/signup

- [ ] **Vercel** - デプロイ先
  - https://vercel.com/signup
  - GitHubアカウントで登録推奨

- [ ] **Meta Developer** - Threads API
  - https://developers.facebook.com
  - アプリ作成済み、Threads製品追加済み

- [ ] **OpenAI** - AI生成
  - https://platform.openai.com
  - APIキー取得済み

- [ ] **Google Cloud**（オプション）- Gemini API
  - https://makersuite.google.com
  - APIキー取得済み

#### ローカル環境確認

```bash
# プロジェクトディレクトリで実行
cd /path/to/threads-auto-poster

# ビルドテスト
npm install
npm run build

# 開発サーバー起動
npm run dev

# http://localhost:3000/dashboard?dev=true にアクセス
# すべての機能が動作することを確認
```

**📖 詳細:** [PRODUCTION_DEPLOYMENT.md - 事前準備](./PRODUCTION_DEPLOYMENT.md#事前準備)

---

### ステップ2: リポジトリ準備 📦

#### .gitignore確認

```bash
# 必須エントリーを確認
cat .gitignore | grep -E "^\.env|^node_modules|^\.next|^prisma.*\.db"
```

すべて含まれていればOK。

#### GitHubリポジトリ作成

```bash
# GitHub CLIで作成（推奨）
gh auth login
gh repo create threads-auto-poster --public --source=. --push

# または手動
git init
git add .
git commit -m "Initial commit: Threads Auto Poster"
git remote add origin https://github.com/YOUR_USERNAME/threads-auto-poster.git
git push -u origin main
```

**📖 詳細:** [VERCEL_DEPLOYMENT_GUIDE.md - GitHubリポジトリの準備](./VERCEL_DEPLOYMENT_GUIDE.md#githubリポジトリの準備)

---

### ステップ3: データベース準備 🗄️

#### Prismaスキーマ更新

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"  // sqlite から変更
  url      = env("DATABASE_URL")
}
```

#### Vercel Postgres作成

1. **Vercel Dashboard → あなたのプロジェクト**
2. **Storage → Create Database**
3. **Postgres を選択**
4. **Database Name:** `threads-auto-poster-db`
5. **Region:** 最寄りのリージョン（例: `iad1`）
6. **Create**
7. **Connect Project** → あなたのプロジェクトを選択

環境変数が自動的に設定されます:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`

**📖 詳細:** [DATABASE_MIGRATION_GUIDE.md](./DATABASE_MIGRATION_GUIDE.md)

---

### ステップ4: 環境変数設定 🔐

#### Vercel Dashboardで設定

```
Project → Settings → Environment Variables
```

**必須変数一覧:**

| 変数名 | 値の例 | 環境 |
|--------|--------|------|
| `THREADS_APP_ID` | `123456789012345` | Production, Preview, Development |
| `THREADS_APP_SECRET` | `abc123def456...` | Production, Preview, Development |
| `THREADS_REDIRECT_URI` | `https://your-app.vercel.app/api/auth/callback` | Production |
| `OPENAI_API_KEY` | `sk-proj-...` | Production, Preview, Development |
| `GEMINI_API_KEY` | `AIzaSy...` | Production, Preview, Development |
| `CRON_SECRET` | `openssl rand -base64 32` で生成 | Production, Preview |

**Preview/Development用のリダイレクトURI:**
- Preview: `https://your-app-git-main-username.vercel.app/api/auth/callback`
- Development: `http://localhost:3000/api/auth/callback`

#### 環境変数生成ヘルパー

```bash
# CRON_SECRETを生成
echo "CRON_SECRET=$(openssl rand -base64 32)"

# すべての環境変数を確認
vercel env ls
```

**📖 詳細:** [ENV_CHECKLIST.md](./ENV_CHECKLIST.md)

---

### ステップ5: ビルド設定確認 ⚙️

#### package.json確認

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && prisma migrate deploy && next build",
    "start": "next start",
    "vercel-build": "prisma generate && prisma migrate deploy && next build",
    "postinstall": "prisma generate"
  }
}
```

重要なポイント:
- `postinstall`: Prisma Clientを自動生成
- `build`/`vercel-build`: マイグレーション自動実行
- `prisma migrate deploy`: 本番用マイグレーション

---

### ステップ6: 初回デプロイ 🚀

```bash
# Vercel CLIでデプロイ
vercel --prod

# 進捗を確認
# ✓ Building
# ✓ Deploying
# ✓ Running Checks
# ✅ Production: https://threads-auto-poster-xxxx.vercel.app
```

#### デプロイログ確認

```bash
# リアルタイムログ
vercel logs --follow

# エラーのみ
vercel logs --output=errors
```

#### 期待される出力

```
✓ Running "prisma generate"
✓ Running "prisma migrate deploy"
✓ Migrations applied: 5 migrations
✓ Building Next.js app
✓ Deployment complete
```

**📖 詳細:** [VERCEL_DEPLOYMENT_GUIDE.md - 初回デプロイ](./VERCEL_DEPLOYMENT_GUIDE.md#初回デプロイ)

---

### ステップ7: Meta Developer設定 🔗

#### リダイレクトURI登録

1. **Meta Developer Dashboardにアクセス**
   ```
   https://developers.facebook.com/apps/YOUR_APP_ID
   ```

2. **製品 → Threads → 設定**

3. **リダイレクトURIセクションで「追加」**
   ```
   https://your-app.vercel.app/api/auth/callback
   ```

4. **複数環境対応（推奨）**
   ```
   https://threads-auto-poster.vercel.app/api/auth/callback
   https://threads-auto-poster-git-main-username.vercel.app/api/auth/callback
   http://localhost:3000/api/auth/callback
   ```

5. **変更を保存**

---

### ステップ8: 動作確認 ✨

#### 基本機能テスト

```bash
# 本番URLにアクセス
open https://your-app.vercel.app
```

**チェックリスト:**

- [ ] **サイトが表示される**
  - トップページが正常に表示

- [ ] **Threads認証が動作する**
  1. 「Threadsと連携する」をクリック
  2. Meta認証画面にリダイレクト
  3. 認証後、ダッシュボードに戻る
  4. アカウント情報が表示される

- [ ] **投稿生成が動作する**
  1. 「投稿を生成」タブ
  2. トピックを入力
  3. 「生成」をクリック
  4. 投稿が生成される

- [ ] **データベース保存が動作する**
  1. 生成した投稿を保存
  2. 「投稿一覧」タブ
  3. 保存した投稿が表示される

- [ ] **設定が保存される**
  1. 「設定」タブ
  2. 基本プロンプトを入力
  3. 保存
  4. リロード後も保持される

- [ ] **自動投稿ルールが作成できる**
  1. 「自動投稿ルール」タブ
  2. 新規ルール作成
  3. 保存
  4. ルール一覧に表示される

#### Cronジョブ確認

```bash
# 5分後にログを確認
vercel logs | grep "cron"

# 期待される出力:
# [cron/publish] Checking scheduled posts...
# [cron/auto-post] Checking auto-post rules...
```

---

### ステップ9: セキュリティ確認 🔒

#### 必須チェック

- [ ] **HTTPS が有効**
  ```bash
  curl -I https://your-app.vercel.app | grep "HTTP"
  # HTTP/2 200
  ```

- [ ] **環境変数が保護されている**
  - `.env` がGitにコミットされていない
  - Vercel Dashboardでのみ管理

- [ ] **Cronエンドポイントが保護されている**
  ```bash
  # 認証なしでアクセス → 401エラー
  curl https://your-app.vercel.app/api/cron/publish
  # {"error":"Unauthorized"}
  ```

- [ ] **データベース接続がSSL**
  ```env
  DATABASE_URL="postgresql://...?sslmode=require"
  ```

**📖 詳細:** [SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md)

---

### ステップ10: カスタムドメイン設定（オプション） 🌐

#### 独自ドメインを使う場合

1. **Vercel Dashboard → Settings → Domains**
2. **「Add」をクリック**
3. **ドメイン名を入力**
   ```
   threads.yourdomain.com
   ```
4. **DNSレコードを設定**
   ```
   Type: CNAME
   Name: threads
   Value: cname.vercel-dns.com
   ```
5. **SSL証明書発行を待つ（数分〜数時間）**
6. **Meta Developerでリダイレクト URI更新**
   ```
   https://threads.yourdomain.com/api/auth/callback
   ```

---

## 🎉 デプロイ完了！

おめでとうございます！Threads Auto Posterの本番環境デプロイが完了しました。

### 次のステップ

#### 1. 監視とメンテナンス

```bash
# 定期的にログを確認
vercel logs

# 週次: エラーログチェック
vercel logs --output=errors

# 月次: 依存関係更新
npm outdated
npm update
```

#### 2. 機能の拡張

- カスタムAIモデルの追加
- 投稿分析機能の強化
- 複数アカウント対応
- 投稿スケジューリングUIの改善

#### 3. パフォーマンス最適化

- 画像最適化の実装
- キャッシング戦略の導入
- データベースクエリの最適化

---

## 📊 デプロイ後チェックリスト

### 初回デプロイ完了時

- [ ] サイトにアクセスできる
- [ ] Threads認証が動作する
- [ ] 投稿生成が動作する
- [ ] データベースに保存できる
- [ ] 設定が保存される
- [ ] 自動投稿ルールが作成できる
- [ ] Cronジョブが実行される（5分待機）
- [ ] ログにエラーがない

### セキュリティ

- [ ] HTTPSが有効
- [ ] 環境変数が保護されている
- [ ] `.env` がGitにコミットされていない
- [ ] Cronエンドポイントが保護されている
- [ ] データベース接続がSSL
- [ ] APIキーがログに出力されていない

### 定期メンテナンス

- [ ] **日次:** エラーログ確認
- [ ] **週次:** アクセスログレビュー
- [ ] **月次:** 依存関係更新
- [ ] **月次:** データベースバックアップ確認
- [ ] **四半期:** セキュリティ監査
- [ ] **四半期:** APIキーローテーション

---

## 🆘 トラブルシューティング

### よくある問題

#### 1. ビルドエラー

**エラー:** `Module not found: Can't resolve '@/lib/...'`

**解決方法:**
```bash
# 依存関係を再インストール
rm -rf node_modules package-lock.json
npm install

# 再デプロイ
vercel --prod --force
```

#### 2. データベース接続エラー

**エラー:** `P1001: Can't reach database server`

**解決方法:**
```env
# DATABASE_URLにSSLモードを追加
DATABASE_URL="postgresql://...?sslmode=require"
```

#### 3. 環境変数が反映されない

**解決方法:**
```bash
# 強制再デプロイ
vercel --prod --force

# または空コミット
git commit --allow-empty -m "chore: trigger redeploy"
git push
```

#### 4. Threads認証エラー

**エラー:** `Invalid redirect URI`

**解決方法:**
1. Meta Developer Dashboardでリダイレクト URIを再確認
2. 大文字小文字、末尾のスラッシュを確認
3. `THREADS_REDIRECT_URI` 環境変数と完全一致させる

---

## 📚 全ドキュメント一覧

| ドキュメント | ページ数 | 内容 |
|-------------|----------|------|
| **DEPLOYMENT_MASTER_GUIDE.md** | このファイル | デプロイ統合ガイド |
| **PRODUCTION_DEPLOYMENT.md** | 約530行 | 本番環境デプロイ完全ガイド |
| **ENV_CHECKLIST.md** | 約400行 | 環境変数チェックリスト |
| **DATABASE_MIGRATION_GUIDE.md** | 約650行 | データベース移行ガイド |
| **VERCEL_DEPLOYMENT_GUIDE.md** | 約750行 | Vercelデプロイ手順書 |
| **SECURITY_CHECKLIST.md** | 約700行 | セキュリティチェックリスト |

---

## 💡 ベストプラクティス

### デプロイフロー

1. **ローカルで開発 → テスト**
   ```bash
   npm run dev
   # 動作確認
   ```

2. **プレビュー環境で確認**
   ```bash
   git checkout -b feature/new-feature
   git push origin feature/new-feature
   # Vercelが自動的にプレビューデプロイ
   ```

3. **本番環境にマージ**
   ```bash
   # PRレビュー後
   git checkout main
   git merge feature/new-feature
   git push origin main
   # 自動的に本番デプロイ
   ```

### 環境管理

- **Development:** `http://localhost:3000`
- **Preview:** `https://your-app-git-branch.vercel.app`
- **Production:** `https://your-app.vercel.app`

### セキュリティ

- APIキーは環境変数のみで管理
- 定期的にキーをローテーション
- ログに機密情報を出力しない
- HTTPS強制
- Cronエンドポイントを保護

---

## 🎓 学習リソース

- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Threads API Documentation](https://developers.facebook.com/docs/threads)

---

**本番環境デプロイの準備が完全に整いました！** 🚀

質問や問題が発生した場合は、各詳細ドキュメントを参照してください。
