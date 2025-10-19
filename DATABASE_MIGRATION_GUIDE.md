# データベース移行ガイド（SQLite → PostgreSQL）

本番環境デプロイに向けたデータベース移行の完全ガイドです。

---

## 📋 目次

1. [移行の概要](#移行の概要)
2. [事前準備](#事前準備)
3. [PostgreSQLセットアップ](#postgresqlセットアップ)
4. [Prismaスキーマの更新](#prismaスキーマの更新)
5. [マイグレーションの実行](#マイグレーションの実行)
6. [データの移行（オプション）](#データの移行オプション)
7. [動作確認](#動作確認)
8. [ロールバック計画](#ロールバック計画)
9. [トラブルシューティング](#トラブルシューティング)

---

## 1. 移行の概要

### なぜPostgreSQLに移行するのか？

| 特徴 | SQLite | PostgreSQL |
|------|--------|------------|
| **本番環境** | ❌ 非推奨 | ✅ 推奨 |
| **同時接続** | 限定的 | 優れている |
| **スケーラビリティ** | 低い | 高い |
| **トランザクション** | 基本的 | 高度 |
| **Vercel対応** | ❌ ファイルシステム非対応 | ✅ 完全対応 |

### 移行の流れ

```
開発環境（SQLite）
    ↓
スキーマ更新
    ↓
本番環境（PostgreSQL）
    ↓
マイグレーション実行
    ↓
動作確認
```

---

## 2. 事前準備

### ✅ 準備チェックリスト

- [ ] 現在のデータベーススキーマを確認
- [ ] 既存データのバックアップ（必要な場合）
- [ ] PostgreSQLプロバイダーを選択
- [ ] 環境変数の準備
- [ ] Prisma CLIがインストール済み

### 現在のスキーマを確認

```bash
# 現在のスキーマを表示
cat prisma/schema.prisma

# マイグレーション履歴を確認
ls -la prisma/migrations/
```

---

## 3. PostgreSQLセットアップ

### オプション1: Vercel Postgres（推奨）

#### メリット
- ✅ Vercelと完全統合
- ✅ 環境変数が自動設定
- ✅ 簡単なセットアップ
- ✅ 無料枠あり

#### セットアップ手順

1. **Vercel Dashboardにアクセス**
   - https://vercel.com/dashboard
   - あなたのプロジェクトを選択

2. **Storageタブに移動**
   ```
   Project → Storage → Create Database
   ```

3. **Postgresを選択**
   - Database Name: `threads-auto-poster-db`
   - Region: `us-east-1` (最寄りのリージョン)
   - Create をクリック

4. **環境変数の自動設定を確認**
   ```
   Settings → Environment Variables
   ```

   以下が自動的に設定されます:
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`

5. **ローカル開発用に環境変数を取得**
   ```bash
   vercel env pull .env.local
   ```

---

### オプション2: Supabase

#### メリット
- ✅ 無料枠が充実
- ✅ リアルタイム機能
- ✅ 追加機能（認証、ストレージ等）

#### セットアップ手順

1. **Supabaseプロジェクト作成**
   - https://supabase.com にアクセス
   - 「New Project」をクリック

2. **プロジェクト設定**
   - Project Name: `threads-auto-poster`
   - Database Password: 強力なパスワードを設定
   - Region: 最寄りのリージョンを選択
   - 「Create new project」をクリック

3. **接続文字列を取得**
   ```
   Settings → Database → Connection string → URI
   ```

   例:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```

4. **環境変数に設定**
   ```env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres?sslmode=require"
   ```

---

### オプション3: Railway

#### メリット
- ✅ CLI統合
- ✅ 簡単なセットアップ
- ✅ 開発者フレンドリー

#### セットアップ手順

```bash
# Railway CLIをインストール
npm install -g @railway/cli

# ログイン
railway login

# プロジェクト初期化
railway init

# PostgreSQLを追加
railway add

# Postgresを選択
# → PostgreSQL

# 接続文字列を取得
railway variables

# DATABASE_URLをコピーして.envに追加
```

---

## 4. Prismaスキーマの更新

### schema.prismaの変更

**変更前:**
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

**変更後:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 完全な schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Account {
  id           String   @id @default(cuid())
  userId       String
  username     String?
  accessToken  String
  expiresAt    DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  posts        Post[]
  autoPostRules AutoPostRule[]
  settings     Settings?

  @@unique([userId])
}

model Post {
  id              String   @id @default(cuid())
  accountId       String
  content         String
  scheduledFor    DateTime?
  publishedAt     DateTime?
  status          PostStatus @default(DRAFT)
  threadsPostId   String?
  metadata        String?  // JSON
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  account         Account  @relation(fields: [accountId], references: [id], onDelete: Cascade)

  @@index([accountId])
  @@index([status])
  @@index([scheduledFor])
}

enum PostStatus {
  DRAFT
  SCHEDULED
  PUBLISHED
  FAILED
}

model AutoPostRule {
  id              String           @id @default(cuid())
  accountId       String
  name            String
  enabled         Boolean          @default(true)
  frequency       PostFrequency    @default(DAILY)
  scheduledTimes  String           // JSON: ["09:00", "15:00"]
  timezone        String           @default("Asia/Tokyo")
  topic           String?
  customPrompt    String?
  aiModel         String           @default("gpt-4")
  lastRunAt       DateTime?
  nextRunAt       DateTime?
  runCount        Int              @default(0)
  maxRuns         Int?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  account         Account          @relation(fields: [accountId], references: [id], onDelete: Cascade)

  @@index([accountId])
  @@index([enabled])
  @@index([nextRunAt])
}

enum PostFrequency {
  HOURLY
  DAILY
  WEEKLY
  MONTHLY
  CUSTOM
}

model Settings {
  id              String   @id @default(cuid())
  accountId       String?  @unique
  basePrompt      String?
  theme           String?
  defaultSchedule String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  account         Account? @relation(fields: [accountId], references: [id], onDelete: Cascade)
}
```

### PostgreSQL固有の最適化（オプション）

PostgreSQLの機能を活用する場合:

```prisma
model Post {
  // ... 既存のフィールド

  // 全文検索インデックス
  @@index([content(ops: raw("gin_trgm_ops"))], type: Gin)

  // パーティショニング対応
  @@map("posts")
}
```

---

## 5. マイグレーションの実行

### ステップ1: ローカルでマイグレーション作成

```bash
# 環境変数を設定（開発用PostgreSQL または SQLite）
# .env
DATABASE_URL="postgresql://user:pass@localhost:5432/dev_db"

# マイグレーションを生成
npx prisma migrate dev --name switch_to_postgresql

# Prisma Clientを再生成
npx prisma generate
```

### ステップ2: 本番環境でマイグレーション実行

#### 方法A: Vercel CLIから実行

```bash
# 本番環境の環境変数を取得
vercel env pull .env.production

# 本番DBに対してマイグレーション実行
DATABASE_URL="$(grep DATABASE_URL .env.production | cut -d '=' -f2-)" npx prisma migrate deploy

# または Vercel Postgres の場合
POSTGRES_PRISMA_URL="$(grep POSTGRES_PRISMA_URL .env.production | cut -d '=' -f2-)" npx prisma migrate deploy
```

#### 方法B: ビルド時に自動実行

**package.json を更新:**

```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build",
    "vercel-build": "prisma generate && prisma migrate deploy && next build",
    "postinstall": "prisma generate"
  }
}
```

**Vercel設定:**

```
Project Settings → General → Build & Development Settings
```

- Build Command: `npm run vercel-build`
- Install Command: `npm install`

---

## 6. データの移行（オプション）

開発環境のSQLiteデータを本番PostgreSQLに移行する場合:

### 方法1: pgloader（推奨）

```bash
# pgloaderをインストール（macOS）
brew install pgloader

# 移行スクリプト作成
cat > migrate.load << 'EOF'
LOAD DATABASE
  FROM sqlite://prisma/dev.db
  INTO postgresql://user:pass@host:5432/production_db

WITH include drop, create tables, create indexes, reset sequences

SET work_mem to '16MB', maintenance_work_mem to '512 MB';
EOF

# 実行
pgloader migrate.load
```

### 方法2: Prisma Studio + CSV

```bash
# 1. SQLiteからデータをエクスポート
npx prisma studio
# → データを手動でCSVエクスポート

# 2. PostgreSQLにインポート
psql -h host -U user -d db -c "\COPY posts FROM 'posts.csv' WITH CSV HEADER"
```

### 方法3: カスタムスクリプト

```typescript
// scripts/migrate-data.ts
import { PrismaClient as SQLiteClient } from '@prisma/client'
import { PrismaClient as PostgresClient } from '@prisma/client'

const sqlite = new SQLiteClient({
  datasources: { db: { url: 'file:./dev.db' } }
})

const postgres = new PostgresClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
})

async function migrateData() {
  // Accounts
  const accounts = await sqlite.account.findMany()
  for (const account of accounts) {
    await postgres.account.create({ data: account })
  }

  // Posts
  const posts = await sqlite.post.findMany()
  for (const post of posts) {
    await postgres.post.create({ data: post })
  }

  console.log('Migration completed!')
}

migrateData()
  .catch(console.error)
  .finally(async () => {
    await sqlite.$disconnect()
    await postgres.$disconnect()
  })
```

```bash
# 実行
DATABASE_URL="postgresql://..." tsx scripts/migrate-data.ts
```

---

## 7. 動作確認

### データベース接続テスト

```bash
# Prisma Studioを起動
DATABASE_URL="your_postgres_url" npx prisma studio

# ブラウザで http://localhost:5555 を開く
# データベースが空であることを確認
```

### マイグレーション状態確認

```bash
# マイグレーション履歴を確認
DATABASE_URL="your_postgres_url" npx prisma migrate status

# 出力例:
# Database schema is up to date!
```

### 本番環境での動作確認

```bash
# アプリをデプロイ
vercel --prod

# ログを確認
vercel logs --follow

# サイトにアクセスして以下を確認:
# 1. 認証が動作する
# 2. 投稿を作成できる
# 3. データが保存される
# 4. 投稿一覧が表示される
```

### データベースクエリテスト

```typescript
// scripts/test-db.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testDatabase() {
  // 接続テスト
  await prisma.$connect()
  console.log('✅ Database connected')

  // テストアカウント作成
  const account = await prisma.account.create({
    data: {
      userId: 'test_user',
      username: 'testuser',
      accessToken: 'test_token',
    }
  })
  console.log('✅ Account created:', account.id)

  // 読み取りテスト
  const accounts = await prisma.account.findMany()
  console.log('✅ Accounts found:', accounts.length)

  // クリーンアップ
  await prisma.account.delete({ where: { id: account.id } })
  console.log('✅ Test data cleaned up')

  await prisma.$disconnect()
}

testDatabase().catch(console.error)
```

```bash
DATABASE_URL="your_postgres_url" tsx scripts/test-db.ts
```

---

## 8. ロールバック計画

### 問題が発生した場合の対処

#### シナリオ1: マイグレーション失敗

```bash
# マイグレーション状態を確認
npx prisma migrate status

# 最後のマイグレーションをロールバック
npx prisma migrate resolve --rolled-back MIGRATION_NAME

# スキーマをリセット（開発環境のみ）
npx prisma migrate reset
```

#### シナリオ2: データ損失

**事前バックアップ:**
```bash
# PostgreSQLバックアップ
pg_dump -h host -U user -d db > backup.sql

# リストア
psql -h host -U user -d db < backup.sql
```

#### シナリオ3: 接続エラー

```bash
# SQLiteに戻す場合
# prisma/schema.prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

# マイグレーション再生成
npx prisma migrate dev
```

---

## 9. トラブルシューティング

### 問題1: SSL接続エラー

**エラー:**
```
Error: P1001: Can't reach database server
```

**解決方法:**
```env
# DATABASE_URLに ?sslmode=require を追加
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# または接続プーリング対応
POSTGRES_PRISMA_URL="postgresql://user:pass@host:5432/db?sslmode=require&pgbouncer=true"
```

### 問題2: マイグレーション競合

**エラー:**
```
Error: P3005: Migration `xxx` failed to apply
```

**解決方法:**
```bash
# 現在の状態を確認
npx prisma migrate status

# ベースラインをマーク
npx prisma migrate resolve --applied MIGRATION_NAME

# または新しいマイグレーションを作成
npx prisma migrate dev --create-only
# 手動でSQLを編集
npx prisma migrate deploy
```

### 問題3: Prisma Client生成エラー

**エラー:**
```
Error: @prisma/client did not initialize yet
```

**解決方法:**
```bash
# Prisma Clientを再生成
npx prisma generate

# node_modulesをクリーンアップ
rm -rf node_modules/.prisma
npm install

# またはVercelで
# package.jsonに追加:
"postinstall": "prisma generate"
```

### 問題4: 型の不一致

**エラー:**
```
Type 'DateTime' is not assignable to type 'string'
```

**解決方法:**

PostgreSQLとSQLiteで型の扱いが異なる場合があります:

```typescript
// Before (SQLite)
scheduledFor: new Date().toISOString()

// After (PostgreSQL)
scheduledFor: new Date()
```

### 問題5: コネクションプール枯渇

**エラー:**
```
Error: P2024: Timed out fetching a new connection
```

**解決方法:**
```env
# 接続制限を設定
DATABASE_URL="postgresql://...?connection_limit=10&pool_timeout=10"

# またはPrismaスキーマで
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL")
}
```

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

---

## ✅ マイグレーション完了チェックリスト

### 事前準備
- [ ] PostgreSQLデータベースが作成済み
- [ ] 接続文字列を取得済み
- [ ] 環境変数が設定済み
- [ ] 既存データのバックアップ（必要な場合）

### マイグレーション実行
- [ ] `prisma/schema.prisma` を PostgreSQL に更新
- [ ] ローカルでマイグレーション生成
- [ ] Prisma Client を再生成
- [ ] ビルドが成功する
- [ ] ローカルで動作確認

### 本番デプロイ
- [ ] Vercel環境変数が設定済み
- [ ] `package.json` ビルドスクリプト更新済み
- [ ] 本番環境にデプロイ
- [ ] マイグレーションが適用された
- [ ] 動作確認完了

### 事後確認
- [ ] データベースに接続できる
- [ ] CRUD操作が正常に動作
- [ ] エラーログに問題なし
- [ ] パフォーマンスが許容範囲

---

## 📚 参考資料

- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [PostgreSQL on Vercel](https://vercel.com/docs/storage/vercel-postgres)
- [Supabase Documentation](https://supabase.com/docs/guides/database)
- [Railway PostgreSQL Guide](https://docs.railway.app/databases/postgresql)

---

**データベース移行の準備が整いました！** 🎉

次のステップ: [Vercelデプロイ手順書](./VERCEL_DEPLOYMENT_GUIDE.md)
