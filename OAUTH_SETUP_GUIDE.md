# Threads OAuth 設定ガイド

最終更新: 2025年10月17日

## 📋 現在の設定情報

### 環境変数 (.env)
```bash
THREADS_APP_ID=1554440308880133
THREADS_APP_SECRET=2cee66d7017838ae8d4c78ab71f87e9c
THREADS_REDIRECT_URI=http://localhost:3002/api/auth/callback
```

### OAuth フロー
1. **認証URL生成**: `/api/auth/login`
2. **コールバック処理**: `/api/auth/callback`
3. **リダイレクトURI**: `http://localhost:3002/api/auth/callback`

### 必要なスコープ
- `threads_basic` - 基本的なプロフィール情報
- `threads_content_publish` - 投稿の作成・公開
- `threads_manage_insights` - インサイトデータの取得
- `threads_manage_replies` - リプライの管理

---

## 🔧 Meta Developer Dashboard での設定手順

### ステップ 1: Meta for Developers にアクセス

1. [Meta for Developers](https://developers.facebook.com/) にアクセス
2. 右上の「マイアプリ」をクリック
3. アプリ「Threads Auto Poster」を選択
   - App ID: `1554440308880133`

### ステップ 2: Threads 製品の設定

#### 方法 A: Threads 設定から直接設定（推奨）

1. 左サイドバーから **「Threads」** を選択
2. 「設定」タブをクリック
3. 「OAuth設定」セクションを探す
4. **「有効なOAuthリダイレクトURI」** フィールドに以下を入力:
   ```
   http://localhost:3002/api/auth/callback
   ```
5. 「変更を保存」をクリック

⚠️ **注意事項**:
- URIは完全一致である必要があります
- `http://` と `https://` は別物として扱われます
- 末尾のスラッシュ `/` の有無も区別されます
- ポート番号 `:3002` も含めて正確に入力してください

#### 方法 B: アプリ設定から追加

1. 左サイドバーの **「設定」** → **「ベーシック」** をクリック
2. 下にスクロールして **「+ プラットフォームを追加」** をクリック
3. **「ウェブサイト」** を選択
4. サイトURL: `http://localhost:3002`
5. 「変更を保存」をクリック
6. その後、方法Aの手順でOAuthリダイレクトURIを設定

### ステップ 3: アプリモードの確認

1. 左サイドバーの **「設定」** → **「ベーシック」** をクリック
2. ページ上部でアプリモードを確認
   - **開発モード**: テスト用（現在の状態）
   - **本番モード**: 一般公開用（App Review必要）

開発段階では **開発モード** のままで問題ありません。

### ステップ 4: アプリシークレットの確認

1. **「設定」** → **「ベーシック」** ページで
2. 「app secret」の **「表示」** ボタンをクリック
3. パスワードを入力
4. 表示された値が `.env` ファイルの値と一致するか確認:
   ```
   THREADS_APP_SECRET=2cee66d7017838ae8d4c78ab71f87e9c
   ```

---

## 🧪 OAuth フローのテスト手順

### 1. 開発サーバーの起動

```bash
cd /Users/soumajun/projects/threads/auto-poster
npm run dev
```

サーバーがポート3002で起動していることを確認:
```
✓ Ready in X.Xs
- Local:   http://localhost:3002
```

### 2. 認証URLの取得

ブラウザまたはcurlで認証URLを取得:

```bash
curl http://localhost:3002/api/auth/login
```

レスポンス例:
```json
{
  "url": "https://threads.net/oauth/authorize?client_id=1554440308880133&redirect_uri=http%3A%2F%2Flocalhost%3A3002%2Fapi%2Fauth%2Fcallback&scope=threads_basic%2Cthreads_content_publish%2Cthreads_manage_insights%2Cthreads_manage_replies&response_type=code"
}
```

### 3. 認証フローの実行

1. 上記のURLをブラウザで開く
2. Threadsアカウントでログイン
3. アプリケーションへのアクセス許可を承認
4. 自動的に `http://localhost:3002/api/auth/callback?code=XXX` にリダイレクト
5. コールバック処理が実行され、`/dashboard?account_id=XXX` にリダイレクト

### 4. 成功の確認

ダッシュボードで以下を確認:
- アカウント情報が表示される
- 投稿の分析・生成が可能になる
- エラーメッセージが表示されない

---

## ❌ よくあるエラーと解決方法

### エラー 1: "redirect_uri_mismatch"

**原因**: Meta Developer Dashboardに登録されているリダイレクトURIとアプリの設定が一致していない

**解決方法**:
1. Meta Developer Dashboardで設定したURIを確認
2. `.env` ファイルの `THREADS_REDIRECT_URI` を確認
3. **完全一致**しているか確認（大文字小文字、スラッシュ、ポート番号すべて）

正しい設定例:
```bash
# .env ファイル
THREADS_REDIRECT_URI=http://localhost:3002/api/auth/callback

# Meta Developer Dashboard
有効なOAuthリダイレクトURI: http://localhost:3002/api/auth/callback
```

### エラー 2: "OAuthリダイレクトURIを記入してください" (Error Code: 1349187)

**原因**: Meta Developer Dashboardでの保存時の検証エラー

**解決方法**:

#### 解決策 A: 別のブラウザ・シークレットモードで試す
1. ブラウザのキャッシュをクリア
2. シークレット/プライベートモードで開く
3. 再度設定を試みる

#### 解決策 B: プラットフォーム追加から設定
1. 「設定」→「ベーシック」→「プラットフォームを追加」
2. 「ウェブサイト」を選択
3. サイトURL: `http://localhost:3002` を入力
4. 保存後、Threads設定でOAuthリダイレクトURIを設定

#### 解決策 C: コールバックURLも同時に設定
以下のすべてのフィールドを埋める:
- **有効なOAuthリダイレクトURI**: `http://localhost:3002/api/auth/callback`
- **コールバックURLをアンインストール**: `http://localhost:3002/deauthorize`
- **コールバックURLを削除**: `http://localhost:3002/data-deletion`

※ アンインストール・削除用のコールバックはダミーでも可

### エラー 3: "Invalid OAuth access token"

**原因**: アクセストークンが無効または期限切れ

**解決方法**:
1. データベースをリセット（開発環境のみ）:
   ```bash
   rm prisma/dev.db
   npx prisma migrate dev --name init
   ```
2. アプリで再度Threads認証を実行

### エラー 4: "App not set up correctly"

**原因**: Threads製品が正しく追加されていない

**解決方法**:
1. 「製品」→「Threads」が追加されているか確認
2. 追加されていない場合: 「製品を追加」→「Threads」を選択
3. 必要な権限が設定されているか確認

---

## 🚀 本番環境への対応

### HTTPS 対応

本番環境ではHTTPSが必須です:

1. **Vercel/Netlifyなどにデプロイ**
2. `.env.production` を作成:
   ```bash
   THREADS_REDIRECT_URI=https://yourdomain.com/api/auth/callback
   ```
3. Meta Developer Dashboardで本番用URIを追加:
   ```
   https://yourdomain.com/api/auth/callback
   ```

### 本番モードへの移行

1. App Reviewを申請（本番公開に必要）
2. 必要な権限の承認を得る
3. アプリモードを「本番」に切り替え

---

## 📝 現在のポート番号について

**重要**: 開発サーバーは現在 **ポート3002** で動作しています。

元々の設定では3000でしたが、別のプロセスが使用中のため3002に変更されました。

### リダイレクトURIの更新が必要

`.env` ファイルで以下を確認:
```bash
THREADS_REDIRECT_URI=http://localhost:3002/api/auth/callback
```

Meta Developer Dashboardでも同じURIに更新してください。

### ポート3000に戻す場合

1. ポート3000を使用しているプロセスを終了:
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```
2. `.env` を更新:
   ```bash
   THREADS_REDIRECT_URI=http://localhost:3000/api/auth/callback
   ```
3. Meta Developer Dashboardも更新

---

## ✅ チェックリスト

設定完了前に以下を確認:

- [ ] Meta Developer Dashboard でリダイレクトURIを保存完了
- [ ] `.env` ファイルのポート番号が正しい（3002）
- [ ] App IDとApp Secretが正しく設定されている
- [ ] 開発サーバーが起動している
- [ ] `/api/auth/login` で認証URLが取得できる
- [ ] 認証フローが正常に動作する
- [ ] ダッシュボードでアカウント情報が表示される

---

## 🆘 サポート

問題が解決しない場合:

1. このガイドのトラブルシューティングセクションを確認
2. [SETUP_PROGRESS.md](SETUP_PROGRESS.md) で進捗状況を確認
3. ブラウザの開発者ツールでエラーを確認
4. サーバーログ（ターミナル）でエラーを確認
5. Meta for Developers のサポートに問い合わせ

---

**次のステップ**: Meta Developer Dashboard で設定を完了したら、[認証フローのテスト](#🧪-oauth-フローのテスト手順)を実行してください。
