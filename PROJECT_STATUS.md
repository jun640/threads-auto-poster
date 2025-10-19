# Threads Auto Poster - プロジェクト状態

最終更新: 2025年10月16日

## プロジェクト概要

Threadsの投稿を自動作成・投稿・分析するツール。AI（OpenAI GPT-4）を活用して投稿スタイルを分析し、自動で投稿を生成します。

## 現在の状態

### ✅ 完了している機能

1. **基本セットアップ**
   - Next.js 15 + TypeScript + Tailwind CSS構成
   - SQLite データベース（Prisma ORM）
   - 依存パッケージのインストール完了
   - データベーステーブル作成済み

2. **認証・アカウント管理**
   - Threads OAuth 2.0 認証フロー実装
   - アクセストークン保存機能
   - ログイン/コールバックエンドポイント

3. **投稿機能**
   - テキスト投稿作成
   - ツリー投稿（複数投稿の連続）対応
   - 投稿ステータス管理（DRAFT/APPROVED/SCHEDULED/PUBLISHED/FAILED）
   - スケジュール投稿機能
   - CRON自動投稿エンドポイント（`/api/cron/publish`）

4. **AI機能**
   - OpenAI GPT-4による投稿分析
   - ポスト自動生成機能
   - トピック指定生成

5. **分析機能**
   - 投稿インサイト取得（いいね、リプライ、リポスト、引用、表示回数）
   - 期間別分析（7日間、30日間、90日間）
   - Rechartsによる可視化（折れ線グラフ、棒グラフ）
   - 総合統計表示

6. **UI/UX**
   - ダーク/ライトモード切り替え
   - レスポンシブデザイン
   - ランディングページ
   - ダッシュボード
   - 投稿一覧・生成・分析タブ

### ⚠️ 未完了・要確認事項

1. **環境変数設定**
   - ❌ `.env` ファイルが未作成
   - 必要な設定:
     - `THREADS_APP_ID`
     - `THREADS_APP_SECRET`
     - `THREADS_REDIRECT_URI`
     - `OPENAI_API_KEY`
     - `DATABASE_URL`
     - `NEXT_PUBLIC_APP_URL`

2. **Meta for Developers アプリ設定**
   - Threads APIアプリの作成・設定が必要
   - リダイレクトURIの登録
   - 必要なスコープ:
     - `threads_basic`
     - `threads_content_publish`
     - `threads_manage_insights`
     - `threads_manage_replies`

3. **テスト・検証**
   - 実際のThreadsアカウントでの連携テスト未実施
   - 投稿・分析機能の実環境テスト未実施
   - エラーハンドリングの検証

4. **本番環境対応**
   - HTTPS対応（本番環境で必須）
   - レート制限実装
   - エラーロギング
   - セキュリティ強化

## プロジェクト構造

```
threads-auto-poster/
├── app/                          # Next.js App Router
│   ├── page.tsx                 # ランディングページ
│   ├── layout.tsx               # レイアウト
│   ├── dashboard/
│   │   └── page.tsx             # メインダッシュボード
│   └── api/
│       ├── auth/                # 認証エンドポイント
│       │   ├── login/route.ts   # Threads OAuth開始
│       │   └── callback/route.ts # OAuth コールバック
│       ├── posts/               # 投稿管理
│       │   ├── route.ts         # 投稿CRUD
│       │   ├── generate/route.ts # AI投稿生成
│       │   ├── analyze/route.ts # 投稿分析
│       │   ├── publish/route.ts # 投稿公開
│       │   └── [id]/route.ts    # 個別投稿操作
│       ├── analytics/           # 分析
│       │   └── fetch/route.ts   # インサイト取得
│       └── cron/
│           └── publish/route.ts # スケジュール投稿実行
├── components/                  # Reactコンポーネント
│   ├── AnalyticsDashboard.tsx  # 分析ダッシュボード
│   ├── PostGenerator.tsx       # 投稿生成UI
│   ├── PostsList.tsx           # 投稿一覧
│   ├── ThemeProvider.tsx       # テーマ管理
│   └── ThemeToggle.tsx         # テーマ切り替え
├── lib/                         # ユーティリティ
│   ├── threads.ts              # Threads API クライアント
│   ├── openai.ts               # OpenAI API クライアント
│   ├── prisma.ts               # Prismaクライアント
│   └── utils.ts                # ヘルパー関数
├── prisma/
│   ├── schema.prisma           # データベーススキーマ
│   └── dev.db                  # SQLiteデータベース
├── .env.example                # 環境変数サンプル
├── package.json
└── README.md
```

## データベーススキーマ

### Account
- アカウント情報とアクセストークンを保存
- 1アカウント = 1 Threads ユーザー

### Post
- 投稿データ（下書き、承認済み、公開済み）
- ツリー投稿対応（parent/child関係）
- スケジュール投稿日時

### PostAnalytics
- 投稿のインサイトデータ
- likes, replies, reposts, quotes, views
- 定期的に更新可能

### AnalyzedPost
- AI分析済み投稿データ
- トーン、トピック、ハッシュタグ等の要素を保存

### Settings
- アプリ設定（テーマ等）

## 次回起動時の手順

### 1. 環境変数設定

```bash
cd /Users/soumajun/threads-auto-poster
cp .env.example .env
```

`.env` を編集して以下を設定:

```env
# Threads API Credentials
THREADS_APP_ID=your_app_id_here
THREADS_APP_SECRET=your_app_secret_here
THREADS_REDIRECT_URI=http://localhost:3000/api/auth/callback

# OpenAI API
OPENAI_API_KEY=sk-your-key-here

# Database
DATABASE_URL="file:./dev.db"

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. データベース準備（既に完了）

```bash
npx prisma generate
# マイグレーションは既に実行済み
```

### 3. 開発サーバー起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開く

### 4. Threads アカウント連携

1. ダッシュボードで「Threadsと連携する」をクリック
2. Threads でログイン・権限承認
3. リダイレクト後、アカウント情報が表示される

### 5. 機能テスト

1. **投稿分析**: 「投稿を生成」タブ → 「投稿を分析」
2. **投稿生成**: トピック入力 → 「投稿を生成」
3. **投稿承認**: 「投稿一覧」タブ → 生成された投稿を承認
4. **投稿実行**: 「今すぐ投稿」または「スケジュール」
5. **分析確認**: 「分析」タブで数値確認

## トラブルシューティング

### エラー: "Missing environment variables"

**原因**: `.env` ファイルが存在しない、または必要な変数が未設定

**解決策**:
```bash
cp .env.example .env
# .env を編集して全ての変数を設定
```

### エラー: "redirect_uri_mismatch"

**原因**: Meta for DevelopersのリダイレクトURIとアプリの設定が不一致

**解決策**:
1. Meta for Developers → アプリ設定 → Threads
2. Valid OAuth Redirect URIs に完全一致するURIを追加:
   ```
   http://localhost:3000/api/auth/callback
   ```
3. 大文字小文字、末尾のスラッシュ、http/httpsを確認

### エラー: "Unauthorized" (Threads API)

**原因**: アクセストークンの期限切れまたは無効

**解決策**:
1. データベースの`Account`テーブルを確認
2. 必要に応じて再認証:
   ```bash
   # データベースリセット（開発環境のみ）
   rm prisma/dev.db
   npx prisma migrate dev --name init
   ```
3. アプリで再度Threads連携

### エラー: "OpenAI API Error"

**原因**: OpenAI APIキーが無効または残高不足

**解決策**:
1. OpenAIダッシュボードでAPIキーを確認
2. 使用量・残高を確認
3. 必要に応じて新しいキーを発行して`.env`を更新

### スケジュール投稿が実行されない

**原因**: CRONジョブが設定されていない

**解決策**:
```bash
# 手動実行でテスト
curl http://localhost:3000/api/cron/publish

# CRONジョブ設定（例: 5分ごと）
*/5 * * * * curl http://localhost:3000/api/cron/publish
```

### データベース接続エラー

**原因**: `DATABASE_URL`が正しくない、またはPrismaクライアント未生成

**解決策**:
```bash
npx prisma generate
npx prisma db push
```

## API制限・注意事項

### Threads API
- **レート制限**: 詳細は公式ドキュメント参照
- **投稿間隔**: 連続投稿は1秒間隔を推奨（実装済み）
- **スコープ**: 本番環境ではApp Reviewが必要

### OpenAI API
- **モデル**: GPT-4使用（コスト高い）
- **トークン制限**: 入力・出力の合計トークン数に注意
- **レート制限**: アカウントのTierによって異なる

## 改善提案・TODO

### 短期（次回セッション）
- [ ] `.env` ファイル作成
- [ ] Meta for Developers アプリ設定
- [ ] OpenAI APIキー取得
- [ ] 実際のアカウントで連携テスト
- [ ] 投稿生成・分析テスト

### 中期
- [ ] エラーハンドリング強化
- [ ] ローディング状態の改善
- [ ] レート制限実装
- [ ] トースト通知の充実
- [ ] 投稿編集機能
- [ ] 画像投稿対応

### 長期
- [ ] 複数アカウント対応
- [ ] Webhook統合（リプライ通知）
- [ ] 詳細な投稿スケジューラー（カレンダーUI）
- [ ] A/Bテスト機能
- [ ] ハッシュタグ分析・提案
- [ ] 競合分析機能
- [ ] 本番環境デプロイ（Vercel等）

## 参考資料

- [Threads API Documentation](https://developers.facebook.com/docs/threads)
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Recharts Documentation](https://recharts.org/)

## 技術的な注意点

### Threads API の特徴
- 投稿は2ステップ: Container作成 → Publish
- ツリー投稿は`reply_to_id`で親投稿を指定
- インサイトは投稿後しばらく経たないと取得できない場合がある

### Next.js App Router
- サーバーコンポーネントとクライアントコンポーネントの区別
- `'use client'` ディレクティブの適切な使用
- APIルートは `route.ts` ファイル

### Prisma
- `synchronize: true` は開発環境のみ
- 本番環境ではマイグレーション使用
- SQLiteは小〜中規模向け（大規模ならPostgreSQL推奨）

## サポート・問い合わせ

問題が発生した場合:
1. このPROJECT_STATUS.mdのトラブルシューティングセクションを確認
2. README.mdの詳細手順を確認
3. エラーメッセージをそのまま検索
4. GitHub Issues（プロジェクトがある場合）

---

次回このプロジェクトに戻る際は:
1. **README.md** - プロジェクト全体の概要を確認
2. **PROJECT_STATUS.md**（このファイル） - 詳細な現在の状態とトラブルシューティングを確認
3. `.env` ファイルの作成から開始
