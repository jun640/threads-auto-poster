# Threads Auto Poster - セットアップ完了ガイド

## 🎉 おめでとうございます！

Threads Auto Posterのセットアップが完了しました。このガイドでは、アプリケーションの起動方法と主な機能の使い方を説明します。

---

## 📋 実装済みの機能

### ✅ コア機能
- **AI投稿生成** - OpenAI GPT-4 & Google Gemini対応
- **自動投稿ルール** - 定期的な自動投稿のスケジュール設定
- **スレッド投稿** - 複数投稿を繋げた連続投稿
- **スケジュール投稿** - 好きな時間に予約投稿
- **投稿分析** - いいね、リプライ、表示回数などの追跡
- **ダーク/ライトモード** - テーマの切り替え
- **複数アカウント管理** - 最大4アカウント以上

### ✅ 開発ツール
- **OAuthテストツール** - Threads API認証のテスト
- **開発モード** - 認証なしでのアプリテスト

---

## 🚀 クイックスタート

### 1. 開発サーバーの起動

```bash
cd /Users/soumajun/projects/threads/auto-poster
npm run dev
```

### 2. アプリケーションへのアクセス

#### 開発モード（認証不要・推奨）
```
http://localhost:3000/dashboard?dev=true
```

#### 本番モード（Threads認証が必要）
```
http://localhost:3000/dashboard
```

---

## 🛠️ ツールの使用方法

### OAuthテストツール

Threads APIの認証設定をテストするツールです。

```bash
npm run test:oauth
```

**メニュー:**
1. 環境変数の検証
2. OAuth認証URLの生成
3. トークン交換のテスト
4. アクセストークンの検証
5. 長期トークンへの変換
6. すべてのテストを実行（フルフロー）← **推奨**

詳細は[OAuthテストガイド](./OAUTH_TEST_GUIDE.md)を参照してください。

---

## 📖 主な機能の使い方

### 1. 投稿を生成

1. ダッシュボードの「投稿を生成」タブを開く
2. （オプション）トピックを入力
3. AIモデルを選択（GPT-4 または Gemini）
4. 「投稿を生成」ボタンをクリック
5. 生成された投稿を確認

**スレッド投稿を生成する場合:**
- 「ツリー形式で生成」にチェックを入れる
- 3-5個の連続投稿が生成されます

### 2. 自動投稿ルールの設定

1. ダッシュボードの「自動投稿ルール」タブを開く
2. 「新しいルール」ボタンをクリック
3. 以下の項目を設定:
   - **ルール名**: 例「毎朝のモチベーション投稿」
   - **投稿頻度**: 毎時間/毎日/毎週/毎月
   - **投稿時刻**: 09:00, 15:00, 21:00（複数指定可能）
   - **トピック**: 投稿のテーマ
   - **カスタムプロンプト**: AIへの追加指示
   - **AIモデル**: GPT-4 または Gemini
   - **スレッド投稿**: チェックで複数投稿
   - **最大実行回数**: オプション（空欄で無制限）
4. 「作成」ボタンをクリック

**ルールの管理:**
- ✅ **有効化/無効化**: ルールのオン/オフ切り替え
- ✏️ **編集**: ルールの設定を変更
- 🗑️ **削除**: ルールを削除

### 3. スケジュール投稿

1. 「投稿一覧」タブで投稿を確認
2. 「承認」ボタンをクリック
3. 「スケジュール」ボタンをクリック
4. 日時を指定して保存

### 4. 投稿の分析

1. 「分析」タブを開く
2. 期間を選択（7日間/30日間/90日間）
3. パフォーマンスを確認:
   - いいね数
   - リプライ数
   - 表示回数
   - エンゲージメント率

---

## ⚙️ 自動投稿の実行設定

### Vercel Cronの設定（推奨）

`vercel.json`ファイルがすでに作成されています:

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

Vercelにデプロイすると、5分ごとに以下が自動実行されます:
- スケジュール投稿の確認と実行
- 自動投稿ルールの確認と実行

### ローカル環境でのcron設定

```bash
# cronジョブを追加
crontab -e

# 以下を追加（5分ごとに実行）
*/5 * * * * curl http://localhost:3000/api/cron/publish
*/5 * * * * curl http://localhost:3000/api/cron/auto-post
```

---

## 🔧 トラブルシューティング

### ビルドエラーが出る場合

```bash
# 依存パッケージを再インストール
rm -rf node_modules package-lock.json
npm install

# Prisma クライアントを再生成
npx prisma generate
```

### データベースをリセットしたい場合

```bash
# データベースをリセット
rm prisma/dev.db

# マイグレーションを再実行
npx prisma migrate dev --name init
```

### ポート3000が使用中の場合

```bash
# 別のポートで起動
PORT=3001 npm run dev

# 環境変数も更新
THREADS_REDIRECT_URI=http://localhost:3001/api/auth/callback
```

---

## 📂 プロジェクト構造

```
threads-auto-poster/
├── app/
│   ├── api/
│   │   ├── auth/           # Threads OAuth認証
│   │   ├── posts/          # 投稿管理
│   │   ├── auto-post-rules/ # 自動投稿ルール
│   │   └── cron/           # 自動実行エンドポイント
│   ├── dashboard/          # メインダッシュボード
│   └── setup/              # セットアップガイド
├── components/             # UIコンポーネント
│   ├── AutoPostRules.tsx   # 自動投稿ルール管理
│   ├── PostGenerator.tsx   # 投稿生成
│   ├── PostsList.tsx       # 投稿一覧
│   └── AnalyticsDashboard.tsx # 分析ダッシュボード
├── lib/                    # ユーティリティ
│   ├── threads.ts          # Threads API
│   ├── openai.ts           # OpenAI API
│   └── gemini.ts           # Gemini API
├── prisma/
│   └── schema.prisma       # データベーススキーマ
├── scripts/
│   └── test-oauth.ts       # OAuthテストツール
└── .env                    # 環境変数
```

---

## 🌐 本番環境へのデプロイ

### Vercelへのデプロイ

1. Vercelアカウントを作成
2. プロジェクトをGitHubにプッシュ
3. Vercelで「New Project」を選択
4. リポジトリを選択
5. 環境変数を設定:
   ```
   THREADS_APP_ID=your_app_id
   THREADS_APP_SECRET=your_app_secret
   THREADS_REDIRECT_URI=https://your-domain.vercel.app/api/auth/callback
   OPENAI_API_KEY=your_openai_key
   GEMINI_API_KEY=your_gemini_key
   DATABASE_URL=your_postgres_url
   ```
6. デプロイ

### 本番環境でのThreads API設定

Meta Developer Dashboardで本番用のリダイレクトURIを追加:
```
https://your-domain.vercel.app/api/auth/callback
```

---

## 📚 関連ドキュメント

- [README.md](./README.md) - プロジェクト概要
- [OAUTH_TEST_GUIDE.md](./OAUTH_TEST_GUIDE.md) - OAuthテスト詳細ガイド
- [OAUTH_SETUP_GUIDE.md](./OAUTH_SETUP_GUIDE.md) - OAuth設定ガイド
- [PROJECT_STATUS.md](./PROJECT_STATUS.md) - プロジェクトステータス

---

## 🎯 次のステップ

1. **開発モードで試す**
   ```bash
   npm run dev
   # http://localhost:3000/dashboard?dev=true を開く
   ```

2. **投稿を生成してみる**
   - 「投稿を生成」タブで試してみましょう

3. **自動投稿ルールを作成**
   - 「自動投稿ルール」タブで設定してみましょう

4. **Threads APIを設定**（実際に投稿したい場合）
   - [OAuthセットアップガイド](./OAUTH_SETUP_GUIDE.md)を参照
   - OAuthテストツールで認証をテスト

5. **本番環境にデプロイ**
   - Vercelまたは他のプラットフォームにデプロイ

---

## 💡 ヒント

### 開発モードの利点
- Threads APIの設定なしで全機能をテスト可能
- 複数アカウントのシミュレーション
- AI投稿生成のテスト

### 自動投稿ルールの活用例
- **毎朝のモチベーション投稿**: 毎日9:00に自己啓発系の投稿
- **定期的なTips投稿**: 毎日12:00と18:00にノウハウをシェア
- **週次の振り返り**: 毎週日曜20:00に一週間の振り返り

### AIモデルの使い分け
- **GPT-4**: より創造的で洗練された文章
- **Gemini**: 高速で効率的、コストパフォーマンス重視

---

## 🆘 サポート

問題が発生した場合:

1. [トラブルシューティング](#🔧-トラブルシューティング)を確認
2. [OAuthテストツール](#oauthテストツール)で環境変数を検証
3. GitHubで[Issue](https://github.com/your-repo/issues)を作成

---

**Happy Posting! 🚀**
