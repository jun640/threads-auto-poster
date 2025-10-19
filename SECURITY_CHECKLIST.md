# セキュリティ設定チェックリスト

本番環境デプロイ時のセキュリティベストプラクティスと設定チェックリストです。

---

## 📋 目次

1. [環境変数とシークレット管理](#環境変数とシークレット管理)
2. [認証とアクセス制御](#認証とアクセス制御)
3. [APIセキュリティ](#apiセキュリティ)
4. [データベースセキュリティ](#データベースセキュリティ)
5. [Cronジョブの保護](#cronジョブの保護)
6. [HTTPS/SSL設定](#httpsssl設定)
7. [レート制限](#レート制限)
8. [ログとモニタリング](#ログとモニタリング)
9. [依存関係のセキュリティ](#依存関係のセキュリティ)
10. [コンプライアンス](#コンプライアンス)

---

## 1. 環境変数とシークレット管理

### ✅ 必須チェック項目

#### 環境変数の保護

- [ ] **`.env` ファイルが `.gitignore` に含まれている**
  ```bash
  # 確認コマンド
  grep -q "^\.env" .gitignore && echo "✅ OK" || echo "❌ NG"
  ```

- [ ] **本番環境のAPIキーと開発環境のAPIキーを分離**
  ```
  開発: OPENAI_API_KEY=sk-dev-xxx
  本番: OPENAI_API_KEY=sk-prod-xxx
  ```

- [ ] **GitHubにシークレットがコミットされていない**
  ```bash
  # 履歴をチェック
  git log -p | grep -i "api_key\|secret\|password"
  ```

#### Vercel環境変数の設定

- [ ] **すべての必須環境変数が設定済み**
  - `THREADS_APP_ID`
  - `THREADS_APP_SECRET`
  - `THREADS_REDIRECT_URI`
  - `OPENAI_API_KEY`
  - `GEMINI_API_KEY`
  - `DATABASE_URL` または `POSTGRES_PRISMA_URL`
  - `CRON_SECRET`

- [ ] **環境変数に機密情報が含まれていない**
  ```
  ❌ 間違い: ERROR_MESSAGE="Failed: API Key is sk-xxx"
  ✅ 正しい: ERROR_MESSAGE="Failed to authenticate"
  ```

### 🔒 推奨設定

#### シークレットのローテーション

```bash
# Cronジョブ用シークレットを生成
openssl rand -base64 32

# 定期的に更新（推奨: 3ヶ月ごと）
```

**ローテーション手順:**
1. 新しいシークレットを生成
2. Vercel環境変数を更新
3. 古いシークレットを削除
4. アプリケーションを再デプロイ

---

## 2. 認証とアクセス制御

### ✅ 必須チェック項目

#### OAuth認証の検証

- [ ] **リダイレクトURIが完全一致している**
  ```
  Meta Developer Dashboard:
  https://your-app.vercel.app/api/auth/callback

  環境変数:
  THREADS_REDIRECT_URI=https://your-app.vercel.app/api/auth/callback
  ```

- [ ] **HTTPSのみを許可（本番環境）**
  ```typescript
  // app/api/auth/login/route.ts
  export async function GET() {
    const redirectUri = process.env.THREADS_REDIRECT_URI

    if (process.env.NODE_ENV === 'production' && !redirectUri?.startsWith('https://')) {
      return NextResponse.json({ error: 'HTTPS required' }, { status: 400 })
    }
    // ...
  }
  ```

- [ ] **状態トークン（CSRF対策）の実装**
  ```typescript
  // OAuth認証時にstateパラメータを使用
  const state = crypto.randomUUID()
  // セッションに保存して検証
  ```

#### セッション管理

- [ ] **アクセストークンの有効期限チェック**
  ```typescript
  // lib/threads-api.ts
  export async function getValidAccessToken(accountId: string) {
    const account = await prisma.account.findUnique({ where: { id: accountId } })

    if (!account) throw new Error('Account not found')

    // 有効期限チェック
    if (account.expiresAt && account.expiresAt < new Date()) {
      // トークンリフレッシュ処理
      return await refreshAccessToken(account)
    }

    return account.accessToken
  }
  ```

- [ ] **長期トークンへの変換**
  ```typescript
  // 短期トークン（1時間） → 長期トークン（60日）
  const longLivedToken = await exchangeForLongLivedToken(shortLivedToken)
  ```

---

## 3. APIセキュリティ

### ✅ 必須チェック項目

#### APIエンドポイントの保護

- [ ] **認証チェックの実装**
  ```typescript
  // app/api/posts/route.ts
  export async function POST(request: NextRequest) {
    const { accountId } = await request.json()

    if (!accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // アカウント存在確認
    const account = await prisma.account.findUnique({ where: { id: accountId } })
    if (!account) {
      return NextResponse.json({ error: 'Invalid account' }, { status: 403 })
    }

    // ...
  }
  ```

- [ ] **入力バリデーション**
  ```typescript
  import { z } from 'zod'

  const PostSchema = z.object({
    accountId: z.string().min(1),
    content: z.string().min(1).max(500),
    scheduledFor: z.string().datetime().optional(),
  })

  export async function POST(request: NextRequest) {
    const body = await request.json()

    // バリデーション
    const result = PostSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error },
        { status: 400 }
      )
    }

    // ...
  }
  ```

- [ ] **SQLインジェクション対策（Prismaは自動対応）**
  ```typescript
  // ✅ Prismaは自動的にパラメータ化
  await prisma.post.findMany({
    where: { accountId: userInput }  // 安全
  })

  // ❌ 生SQLの場合は注意
  await prisma.$queryRaw`SELECT * FROM posts WHERE id = ${userInput}`  // 危険
  await prisma.$queryRaw`SELECT * FROM posts WHERE id = ${Prisma.join([userInput])}`  // 安全
  ```

#### CORS設定

- [ ] **適切なCORS設定**
  ```typescript
  // middleware.ts
  import { NextResponse } from 'next/server'
  import type { NextRequest } from 'next/server'

  export function middleware(request: NextRequest) {
    // 本番環境では特定のオリジンのみ許可
    const allowedOrigins = process.env.NODE_ENV === 'production'
      ? ['https://your-app.vercel.app']
      : ['http://localhost:3000']

    const origin = request.headers.get('origin')

    if (origin && !allowedOrigins.includes(origin)) {
      return new NextResponse(null, { status: 403 })
    }

    return NextResponse.next()
  }
  ```

---

## 4. データベースセキュリティ

### ✅ 必須チェック項目

#### 接続セキュリティ

- [ ] **SSL/TLS接続を強制**
  ```env
  DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
  ```

- [ ] **接続プール設定**
  ```env
  DATABASE_URL="postgresql://...?connection_limit=10&pool_timeout=10"
  ```

- [ ] **データベース認証情報の保護**
  ```
  ❌ コードにハードコーディング
  ✅ 環境変数から読み込み
  ```

#### データ保護

- [ ] **カスケード削除の設定**
  ```prisma
  model Post {
    accountId String
    account   Account @relation(fields: [accountId], references: [id], onDelete: Cascade)
  }
  ```

- [ ] **センシティブデータの暗号化**
  ```typescript
  import crypto from 'crypto'

  const algorithm = 'aes-256-cbc'
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')

  export function encrypt(text: string): string {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(algorithm, key, iv)
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()])

    return iv.toString('hex') + ':' + encrypted.toString('hex')
  }

  export function decrypt(text: string): string {
    const [ivHex, encryptedHex] = text.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    const encrypted = Buffer.from(encryptedHex, 'hex')
    const decipher = crypto.createDecipheriv(algorithm, key, iv)
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])

    return decrypted.toString()
  }
  ```

- [ ] **定期バックアップの設定**
  ```bash
  # PostgreSQLバックアップ（cron設定）
  0 2 * * * pg_dump -h host -U user -d db > backup_$(date +\%Y\%m\%d).sql
  ```

---

## 5. Cronジョブの保護

### ✅ 必須チェック項目

#### エンドポイント認証

- [ ] **Cronシークレットの実装**
  ```typescript
  // app/api/cron/publish/route.ts
  import { NextRequest, NextResponse } from 'next/server'

  export async function GET(request: NextRequest) {
    // Vercel Cronからのリクエストを検証
    const authHeader = request.headers.get('authorization')
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`

    if (authHeader !== expectedAuth) {
      console.error('Unauthorized cron request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Cron処理...
  }
  ```

- [ ] **Vercel Cron専用認証ヘッダーの検証**
  ```typescript
  export async function GET(request: NextRequest) {
    // Vercelが自動設定するヘッダー
    const cronSecret = request.headers.get('x-vercel-cron-secret')

    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ...
  }
  ```

#### レート制限

- [ ] **Cron実行頻度の制限**
  ```typescript
  // 最後の実行から5分以内は再実行しない
  const lastRun = await prisma.cronLog.findFirst({
    orderBy: { createdAt: 'desc' }
  })

  if (lastRun && lastRun.createdAt > new Date(Date.now() - 5 * 60 * 1000)) {
    return NextResponse.json({ message: 'Too soon' }, { status: 429 })
  }
  ```

---

## 6. HTTPS/SSL設定

### ✅ 必須チェック項目

- [ ] **HTTPS強制リダイレクト（Vercelは自動）**

  Vercelは自動的にHTTPSを強制しますが、念のため確認:
  ```typescript
  // middleware.ts
  export function middleware(request: NextRequest) {
    const proto = request.headers.get('x-forwarded-proto')

    if (process.env.NODE_ENV === 'production' && proto !== 'https') {
      const url = request.nextUrl.clone()
      url.protocol = 'https'
      return NextResponse.redirect(url)
    }

    return NextResponse.next()
  }
  ```

- [ ] **SSL証明書の有効期限確認**
  ```
  Vercel → Project → Settings → Domains
  → SSL証明書が「Active」であることを確認
  ```

- [ ] **HSTSヘッダーの設定**
  ```typescript
  // next.config.js
  module.exports = {
    async headers() {
      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'Strict-Transport-Security',
              value: 'max-age=63072000; includeSubDomains; preload'
            }
          ]
        }
      ]
    }
  }
  ```

---

## 7. レート制限

### ✅ 必須チェック項目

#### API レート制限の実装

- [ ] **IPベースのレート制限**
  ```typescript
  // lib/rate-limit.ts
  import { LRUCache } from 'lru-cache'

  type RateLimitConfig = {
    interval: number  // ミリ秒
    uniqueTokenPerInterval: number
  }

  export function rateLimit(config: RateLimitConfig) {
    const tokenCache = new LRUCache({
      max: config.uniqueTokenPerInterval || 500,
      ttl: config.interval || 60000,
    })

    return {
      check: (limit: number, token: string) =>
        new Promise<void>((resolve, reject) => {
          const tokenCount = (tokenCache.get(token) as number[]) || [0]
          if (tokenCount[0] === 0) {
            tokenCache.set(token, tokenCount)
          }
          tokenCount[0] += 1

          const currentUsage = tokenCount[0]
          const isRateLimited = currentUsage >= limit

          return isRateLimited ? reject() : resolve()
        }),
    }
  }
  ```

  ```typescript
  // app/api/posts/route.ts
  import { rateLimit } from '@/lib/rate-limit'

  const limiter = rateLimit({
    interval: 60 * 1000, // 1分
    uniqueTokenPerInterval: 500,
  })

  export async function POST(request: NextRequest) {
    const ip = request.ip ?? '127.0.0.1'

    try {
      await limiter.check(10, ip) // 1分間に10リクエストまで
    } catch {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // ...
  }
  ```

- [ ] **ユーザーごとのレート制限**
  ```typescript
  // アカウントIDベース
  await limiter.check(100, accountId) // 1分間に100リクエストまで
  ```

---

## 8. ログとモニタリング

### ✅ 必須チェック項目

#### セキュアなログ設定

- [ ] **機密情報をログに出力しない**
  ```typescript
  // ❌ 間違い
  console.log('Token:', accessToken)
  console.log('User data:', { email, password })

  // ✅ 正しい
  console.log('Token received:', accessToken ? 'Yes' : 'No')
  console.log('User data:', { email, password: '***' })
  ```

- [ ] **構造化ロギング**
  ```typescript
  // lib/logger.ts
  export const logger = {
    info: (message: string, meta?: object) => {
      console.log(JSON.stringify({
        level: 'info',
        message,
        timestamp: new Date().toISOString(),
        ...meta
      }))
    },
    error: (message: string, error?: Error, meta?: object) => {
      console.error(JSON.stringify({
        level: 'error',
        message,
        error: error?.message,
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
        timestamp: new Date().toISOString(),
        ...meta
      }))
    }
  }
  ```

#### エラー監視

- [ ] **エラートラッキングの設定（オプション）**
  ```bash
  npm install @sentry/nextjs
  ```

  ```typescript
  // sentry.client.config.ts
  import * as Sentry from '@sentry/nextjs'

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  })
  ```

---

## 9. 依存関係のセキュリティ

### ✅ 必須チェック項目

#### 脆弱性スキャン

- [ ] **npm auditの実行**
  ```bash
  # 脆弱性チェック
  npm audit

  # 自動修正（可能な場合）
  npm audit fix

  # 強制修正（破壊的変更の可能性あり）
  npm audit fix --force
  ```

- [ ] **依存関係の定期更新**
  ```bash
  # 古いパッケージを確認
  npm outdated

  # パッチバージョンのみ更新
  npm update

  # メジャーバージョン更新（注意）
  npm install package@latest
  ```

#### GitHub Dependabot

- [ ] **Dependabotの有効化**
  ```yaml
  # .github/dependabot.yml
  version: 2
  updates:
    - package-ecosystem: "npm"
      directory: "/"
      schedule:
        interval: "weekly"
      open-pull-requests-limit: 10
  ```

---

## 10. コンプライアンス

### ✅ 必須チェック項目

#### プライバシーポリシー

- [ ] **プライバシーポリシーの作成**
  - 収集するデータの種類
  - データの使用目的
  - データの保存期間
  - ユーザーの権利

- [ ] **Cookie同意バナー（必要な場合）**
  ```typescript
  // components/CookieConsent.tsx
  'use client'

  import { useState, useEffect } from 'react'

  export default function CookieConsent() {
    const [show, setShow] = useState(false)

    useEffect(() => {
      const consent = localStorage.getItem('cookie-consent')
      if (!consent) setShow(true)
    }, [])

    const accept = () => {
      localStorage.setItem('cookie-consent', 'true')
      setShow(false)
    }

    if (!show) return null

    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4">
        <p>このサイトはCookieを使用しています。</p>
        <button onClick={accept}>同意する</button>
      </div>
    )
  }
  ```

#### データ保護

- [ ] **GDPR対応（EU向けサービスの場合）**
  - データ削除機能
  - データエクスポート機能
  - 利用規約への同意

- [ ] **ユーザーデータの削除機能**
  ```typescript
  // app/api/account/delete/route.ts
  export async function DELETE(request: NextRequest) {
    const { accountId } = await request.json()

    // すべての関連データを削除（カスケード）
    await prisma.account.delete({
      where: { id: accountId }
    })

    return NextResponse.json({ message: 'Account deleted' })
  }
  ```

---

## 🔐 セキュリティ監査チェックリスト

### デプロイ前

- [ ] 環境変数が適切に設定されている
- [ ] `.env` がGitにコミットされていない
- [ ] すべてのAPIエンドポイントに認証がある
- [ ] 入力バリデーションが実装されている
- [ ] HTTPS強制が有効
- [ ] Cronジョブが保護されている
- [ ] レート制限が実装されている
- [ ] ログに機密情報が含まれていない

### デプロイ後

- [ ] SSL証明書が有効
- [ ] OAuth認証が動作する
- [ ] データベース接続が暗号化されている
- [ ] エラーログを確認
- [ ] 脆弱性スキャンを実行
- [ ] パフォーマンステストを実施

### 定期メンテナンス

- [ ] 週次: ログレビュー
- [ ] 月次: 依存関係更新
- [ ] 月次: セキュリティ監査
- [ ] 四半期: APIキーローテーション
- [ ] 四半期: ペネトレーションテスト（オプション）

---

## 📚 参考リンク

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
- [Vercel Security](https://vercel.com/docs/security)
- [Prisma Security](https://www.prisma.io/docs/concepts/components/prisma-client/security)

---

**セキュリティ設定が完了しました！** 🔒

次のステップ: [本番環境デプロイ](./PRODUCTION_DEPLOYMENT.md)
