# 環境変数チェックリスト

本番環境デプロイに必要な環境変数の完全チェックリストです。

---

## 📋 必須環境変数

### 1. Threads API設定

| 変数名 | 説明 | 取得方法 | 例 |
|--------|------|----------|-----|
| `THREADS_APP_ID` | Threads App ID | Meta Developer Dashboard → あなたのアプリ → 設定 → 基本設定 | `123456789012345` |
| `THREADS_APP_SECRET` | Threads App Secret | Meta Developer Dashboard → あなたのアプリ → 設定 → 基本設定 | `abc123def456...` |
| `THREADS_REDIRECT_URI` | OAuth リダイレクトURI | Vercel デプロイ後のドメイン | `https://your-app.vercel.app/api/auth/callback` |

#### ✅ 確認事項
- [ ] Meta Developer Dashboardでアプリが作成済み
- [ ] Threads製品がアプリに追加済み
- [ ] リダイレクトURIがMeta Developer Dashboardに登録済み
- [ ] HTTPSであることを確認（本番環境のみ）
- [ ] 末尾にスラッシュがないことを確認

---

### 2. AI API設定

#### OpenAI (必須)

| 変数名 | 説明 | 取得方法 | 例 |
|--------|------|----------|-----|
| `OPENAI_API_KEY` | OpenAI API Key | https://platform.openai.com/api-keys | `sk-proj-...` |

#### ✅ 確認事項
- [ ] OpenAIアカウント作成済み
- [ ] API Keyが有効
- [ ] 使用量制限を確認
- [ ] 課金設定を確認（必要に応じて）

#### Google Gemini (オプション)

| 変数名 | 説明 | 取得方法 | 例 |
|--------|------|----------|-----|
| `GEMINI_API_KEY` | Google Gemini API Key | https://makersuite.google.com/app/apikey | `AIzaSy...` |

#### ✅ 確認事項
- [ ] Google Cloud プロジェクト作成済み
- [ ] Gemini API が有効化済み
- [ ] API Keyが有効
- [ ] 無料枠を確認

---

### 3. データベース設定

#### オプション A: Vercel Postgres（推奨）

自動設定される変数:

| 変数名 | 説明 | 自動設定 |
|--------|------|----------|
| `POSTGRES_URL` | PostgreSQL接続URL | ✅ Yes |
| `POSTGRES_PRISMA_URL` | Prisma用接続URL | ✅ Yes |
| `POSTGRES_URL_NON_POOLING` | 非プーリング接続URL | ✅ Yes |

#### ✅ 確認事項
- [ ] Vercel Postgres データベースが作成済み
- [ ] プロジェクトにリンク済み
- [ ] 環境変数が自動設定されている

#### オプション B: 手動設定（Supabase/Railway等）

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `DATABASE_URL` | PostgreSQL接続URL | `postgresql://user:pass@host:5432/db?sslmode=require` |

#### ✅ 確認事項
- [ ] データベースが作成済み
- [ ] 接続文字列が正しい
- [ ] SSL/TLSが有効（`?sslmode=require`）
- [ ] ファイアウォール設定でVercelからの接続を許可

---

### 4. セキュリティ設定（推奨）

| 変数名 | 説明 | 生成方法 | 例 |
|--------|------|----------|-----|
| `CRON_SECRET` | Cronエンドポイント保護用シークレット | `openssl rand -base64 32` | `xK7mP9qR...` |

#### ✅ 確認事項
- [ ] ランダムな文字列を生成済み
- [ ] 32文字以上の長さ
- [ ] Cronエンドポイントで検証実装済み

---

## 🔍 環境変数の検証

### ローカル環境での検証

```bash
# .env ファイルを確認
cat .env

# 必須変数が設定されているか確認
node -e "
const required = [
  'THREADS_APP_ID',
  'THREADS_APP_SECRET',
  'THREADS_REDIRECT_URI',
  'OPENAI_API_KEY'
];

require('dotenv').config();

required.forEach(key => {
  if (process.env[key]) {
    console.log('✅', key);
  } else {
    console.log('❌', key, 'が設定されていません');
  }
});
"
```

### Vercel環境での確認

```bash
# Vercel CLIで環境変数を確認
vercel env ls

# 本番環境の環境変数を確認
vercel env ls --environment production
```

---

## 📝 環境別設定

### Development（開発環境）

`.env` ファイル:

```env
# Threads API
THREADS_APP_ID=your_app_id
THREADS_APP_SECRET=your_app_secret
THREADS_REDIRECT_URI=http://localhost:3000/api/auth/callback

# AI APIs
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...

# Database (SQLite)
DATABASE_URL="file:./dev.db"
```

### Production（本番環境）

Vercel Dashboard → Settings → Environment Variables:

```env
# Threads API
THREADS_APP_ID=your_app_id
THREADS_APP_SECRET=your_app_secret
THREADS_REDIRECT_URI=https://your-app.vercel.app/api/auth/callback

# AI APIs
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...

# Database (PostgreSQL)
DATABASE_URL=postgresql://...
# または Vercel Postgres の場合は自動設定

# Security
CRON_SECRET=random_secret_here
```

---

## ⚠️ よくある間違い

### 1. リダイレクトURIの不一致

❌ **間違い:**
```env
# .env
THREADS_REDIRECT_URI=http://localhost:3000/api/auth/callback

# Meta Developer Dashboard
https://your-app.vercel.app/api/auth/callback/
```

✅ **正しい:**
- 完全に一致させる
- 大文字小文字を確認
- 末尾のスラッシュに注意
- HTTPSであることを確認（本番環境）

### 2. ポート番号の不一致

❌ **間違い:**
```env
THREADS_REDIRECT_URI=http://localhost:3002/api/auth/callback
# でも開発サーバーは 3000 で起動
```

✅ **正しい:**
```env
THREADS_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

### 3. データベースURLのSSL設定漏れ

❌ **間違い:**
```env
DATABASE_URL=postgresql://user:pass@host:5432/db
```

✅ **正しい:**
```env
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
```

### 4. APIキーの引用符

❌ **間違い:**
```env
OPENAI_API_KEY="sk-..."  # 引用符は不要
```

✅ **正しい:**
```env
OPENAI_API_KEY=sk-...
```

---

## 🚀 デプロイ前最終チェック

### ステップ1: ローカルで確認

```bash
# 環境変数を読み込んでアプリを起動
npm run dev

# 以下を確認:
# 1. Threads認証が動作する
# 2. 投稿生成が動作する
# 3. データベースに保存できる
```

### ステップ2: Vercelで環境変数を設定

```bash
# Vercel Dashboardで設定
# または CLIで:
vercel env add THREADS_APP_ID
vercel env add THREADS_APP_SECRET
vercel env add THREADS_REDIRECT_URI
vercel env add OPENAI_API_KEY
vercel env add GEMINI_API_KEY
vercel env add CRON_SECRET
```

### ステップ3: Meta Developerで確認

1. https://developers.facebook.com/apps にアクセス
2. あなたのアプリを選択
3. Threads → 設定
4. リダイレクトURIに本番環境のURLが追加されているか確認

### ステップ4: デプロイ

```bash
vercel --prod
```

### ステップ5: デプロイ後の動作確認

```bash
# ログを確認
vercel logs --follow

# サイトにアクセスして以下を確認:
# 1. サイトが表示される
# 2. Threads認証が動作する
# 3. 投稿生成が動作する
# 4. データが保存される
```

---

## 🔒 セキュリティベストプラクティス

### ✅ やるべきこと

- [ ] `.env` ファイルを `.gitignore` に追加
- [ ] 本番環境のAPIキーと開発環境のAPIキーを分ける
- [ ] 定期的にAPIキーをローテーション
- [ ] Vercelの環境変数は暗号化されていることを確認
- [ ] CRON_SECRETを必ず設定
- [ ] データベース接続にSSL/TLSを使用

### ❌ やってはいけないこと

- [ ] `.env` ファイルをGitにコミット
- [ ] APIキーをコードにハードコーディング
- [ ] APIキーをログに出力
- [ ] 本番環境のAPIキーをSlack等で共有
- [ ] 開発環境と本番環境で同じシークレットを使用

---

## 📚 参考リンク

- [Vercel環境変数ドキュメント](https://vercel.com/docs/projects/environment-variables)
- [Meta Developer Dashboard](https://developers.facebook.com/apps)
- [OpenAI API Keys](https://platform.openai.com/api-keys)
- [Google AI Studio](https://makersuite.google.com/app/apikey)
- [Prisma データベース接続](https://www.prisma.io/docs/concepts/database-connectors/postgresql)

---

## 💡 トラブルシューティング

### 環境変数が反映されない

**解決方法:**
1. Vercel Dashboardで設定を再確認
2. 再デプロイを実行: `vercel --prod --force`
3. ブラウザキャッシュをクリア

### OAuth認証エラー

**解決方法:**
1. `THREADS_REDIRECT_URI` がMeta Developer Dashboardと完全一致しているか確認
2. HTTPSであることを確認（本番環境）
3. Vercelログでエラー詳細を確認: `vercel logs`

### データベース接続エラー

**解決方法:**
1. `DATABASE_URL` が正しいか確認
2. SSL設定を確認: `?sslmode=require`
3. データベースプロバイダーのファイアウォール設定を確認
4. Prisma接続テスト: `npx prisma db pull`

---

**これで環境変数の設定は完璧です！** 🎉
