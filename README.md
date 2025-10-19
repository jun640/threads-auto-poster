# Threads Auto Poster

Threadsの投稿を自動作成・投稿・分析するツールです。

## 機能

- **AI分析・生成**: 指定したアカウントの投稿を分析し、AIが自動でポストを生成
- **ツリー投稿**: 複数の投稿を繋げたスレッド形式での投稿に対応
- **スケジュール投稿**: 好きな時間に投稿を予約。承認してから公開できます
- **自動投稿ルール**: 定期的に自動で投稿を生成・公開するルールを設定可能
  - 毎時間/毎日/毎週/毎月の投稿スケジュール
  - カスタム時刻指定（複数時刻対応）
  - トピック・プロンプトのカスタマイズ
  - 最大実行回数の設定
- **詳細な分析**: いいね、リプライ、表示回数など詳細な数値を追跡
- **ダーク/ライトモード**: テーマの切り替えに対応
- **期間分析**: 7日間、30日間、90日間の数値分析

## セットアップ

### 1. 依存パッケージのインストール

\`\`\`bash
npm install
\`\`\`

### 2. 環境変数の設定

\`.env.example\`をコピーして\`.env\`を作成し、必要な値を設定してください:

\`\`\`bash
cp .env.example .env
\`\`\`

必要な環境変数:
- \`THREADS_APP_ID\`: Threads APIのアプリID
- \`THREADS_APP_SECRET\`: Threads APIのシークレット
- \`THREADS_REDIRECT_URI\`: OAuth認証後のリダイレクトURI
- \`OPENAI_API_KEY\`: OpenAI APIキー (投稿の分析・生成に使用)

### 3. データベースのセットアップ

\`\`\`bash
npx prisma migrate dev --name init
npx prisma generate
\`\`\`

### 4. 開発サーバーの起動

\`\`\`bash
npm run dev
\`\`\`

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## Threads API設定

1. [Meta for Developers](https://developers.facebook.com/)でアプリを作成
2. Threads API製品を追加
3. OAuth設定でリダイレクトURIを設定
4. 必要な権限を設定:
   - \`threads_basic\`
   - \`threads_content_publish\`
   - \`threads_manage_insights\`
   - \`threads_manage_replies\`

### OAuth認証のテスト

OAuth設定が正しいか確認するには、テストツールを使用します:

\`\`\`bash
npm run test:oauth
\`\`\`

詳細は[OAuthテストガイド](./OAUTH_TEST_GUIDE.md)を参照してください。

## 使い方

### 1. アカウント連携

ダッシュボードから「Threadsと連携する」ボタンをクリックし、認証を完了します。

### 2. 投稿の分析

「投稿を生成」タブで「投稿を分析」ボタンをクリックすると、あなたの投稿スタイルを分析します。

### 3. 投稿の生成

分析完了後、トピックを入力(任意)し、「投稿を生成」ボタンをクリックします。
ツリー形式にチェックを入れると、3-5個の連続投稿が生成されます。

### 4. 投稿の承認

「投稿一覧」タブで生成された投稿を確認し、「承認」ボタンをクリックします。

### 5. 投稿

承認後、「今すぐ投稿」または「スケジュール」ボタンで投稿できます。

### 6. 分析

「分析」タブで投稿のパフォーマンスを確認できます。

## 自動投稿の設定

### 1. 自動投稿ルールの作成

ダッシュボードの「自動投稿ルール」タブから、定期的に投稿を自動化するルールを作成できます。

**設定項目:**
- **ルール名**: ルールの識別用の名前
- **投稿頻度**: 毎時間/毎日/毎週/毎月
- **投稿時刻**: 投稿を実行する時刻（複数指定可能）
- **トピック**: 投稿のテーマ（オプション）
- **カスタムプロンプト**: AIへの追加指示（オプション）
- **AIモデル**: GPT-4 または Gemini
- **スレッド投稿**: 複数投稿を繋げるか
- **最大実行回数**: ルールの実行回数制限（オプション）

### 2. cronジョブの設定

自動投稿とスケジュール投稿を実行するには、cronジョブを設定してください:

\`\`\`bash
# 5分ごとにスケジュール投稿と自動投稿ルールをチェック
*/5 * * * * curl http://localhost:3000/api/cron/publish
*/5 * * * * curl http://localhost:3000/api/cron/auto-post
\`\`\`

または、Vercelなどのプラットフォームを使用している場合は、Vercel Cronを利用できます:

**vercel.json:**
\`\`\`json
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
\`\`\`

## 技術スタック

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **データベース**: SQLite (Prisma ORM)
- **認証**: Threads OAuth
- **AI**: OpenAI GPT-4
- **チャート**: Recharts
- **状態管理**: Zustand
- **通知**: React Hot Toast

## 📚 ドキュメント

### セットアップ・開発ガイド

- **[SETUP_COMPLETE.md](./SETUP_COMPLETE.md)** - プロジェクトの全機能と使い方
- **[OAUTH_TEST_GUIDE.md](./OAUTH_TEST_GUIDE.md)** - OAuth認証テストツールの使い方

### 本番環境デプロイガイド

本番環境へのデプロイに関する完全なドキュメントを用意しています:

#### 📖 統合ガイド（まずはこちらを確認）
- **[DEPLOYMENT_MASTER_GUIDE.md](./DEPLOYMENT_MASTER_GUIDE.md)** - デプロイの全体像とクイックスタート

#### 📋 詳細ガイド
- **[PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)** - 本番環境デプロイ完全ガイド（10ステップ）
- **[ENV_CHECKLIST.md](./ENV_CHECKLIST.md)** - 環境変数チェックリスト
- **[DATABASE_MIGRATION_GUIDE.md](./DATABASE_MIGRATION_GUIDE.md)** - SQLite → PostgreSQL 移行ガイド
- **[VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)** - Vercel デプロイ手順書
- **[SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md)** - セキュリティチェックリスト

### デプロイクイックスタート

```bash
# 1. GitHubにpush
gh repo create threads-auto-poster --public --source=. --push

# 2. Vercelにデプロイ
npm i -g vercel
vercel --prod

# 3. 環境変数設定（Vercel Dashboard）
# 4. Vercel Postgres作成
# 5. Meta DeveloperでリダイレクトURI登録
```

詳細は [DEPLOYMENT_MASTER_GUIDE.md](./DEPLOYMENT_MASTER_GUIDE.md) を参照してください。

## ライセンス

MIT
