# Threads OAuth テストツール 使用ガイド

このツールは、Threads APIのOAuth認証フローを包括的にテストするためのコマンドラインツールです。

## 📋 目次

- [機能](#機能)
- [セットアップ](#セットアップ)
- [使用方法](#使用方法)
- [各テストの詳細](#各テストの詳細)
- [トラブルシューティング](#トラブルシューティング)

## 🎯 機能

このツールは以下の機能を提供します:

1. **環境変数の検証** - `.env`ファイルの設定が正しいか確認
2. **OAuth認証URLの生成** - Threads認証用のURLを生成
3. **トークン交換のテスト** - 認証コードをアクセストークンに交換
4. **アクセストークンの検証** - トークンが有効か確認し、ユーザー情報を取得
5. **長期トークンへの変換** - 短期トークン（1時間）を長期トークン（60日）に変換
6. **フルフローテスト** - 上記すべてを自動で実行

## 🚀 セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env`ファイルに以下の変数が設定されていることを確認してください:

```env
# Threads API Configuration
THREADS_APP_ID=your_app_id_here
THREADS_APP_SECRET=your_app_secret_here
THREADS_REDIRECT_URI=http://localhost:3000/api/auth/callback

# Optional: AI機能用
OPENAI_API_KEY=sk-your-openai-api-key
GEMINI_API_KEY=your-gemini-api-key
```

### 3. Meta Developer Dashboardの設定

1. [Meta for Developers](https://developers.facebook.com/)にアクセス
2. アプリのダッシュボードを開く
3. 「製品」→「Threads」→「設定」
4. 「有効なOAuthリダイレクトURI」に以下を追加:
   ```
   http://localhost:3000/api/auth/callback
   ```
5. 保存

## 💻 使用方法

### 基本的な使い方

ツールを起動するには、以下のコマンドを実行します:

```bash
npm run test:oauth
```

### メニュー画面

ツールを起動すると、以下のようなメニューが表示されます:

```
🧪 Threads OAuth テストツール
────────────────────────────────────────────────────────────

以下のテストを選択してください:

  1) 環境変数の検証
  2) OAuth認証URLの生成
  3) トークン交換のテスト
  4) アクセストークンの検証
  5) 長期トークンへの変換
  6) すべてのテストを実行（フルフロー）
  0) 終了

選択 (0-6):
```

## 📖 各テストの詳細

### 1. 環境変数の検証

`.env`ファイルに設定された環境変数が正しいかチェックします。

**検証項目:**
- `THREADS_APP_ID` の存在と形式（数字のみ）
- `THREADS_APP_SECRET` の存在と長さ
- `THREADS_REDIRECT_URI` の存在とURL形式
- `OPENAI_API_KEY` の存在と形式（オプション）
- `GEMINI_API_KEY` の存在（オプション）

**実行例:**
```
📋 環境変数の検証
────────────────────────────────────────────────────────────
✓  THREADS_APP_ID: 1554440308880133
✓  THREADS_APP_SECRET: 2cee66d7...
✓  THREADS_REDIRECT_URI: http://localhost:3000/api/auth/callback
✓  OPENAI_API_KEY: 設定済み
ℹ  GEMINI_API_KEY: 未設定（Gemini AI機能は使用できません）
```

### 2. OAuth認証URLの生成

Threads認証用のURLを生成します。このURLをブラウザで開くことで、OAuth認証フローを開始できます。

**生成されるURL:**
```
https://threads.net/oauth/authorize?
  client_id=YOUR_APP_ID&
  redirect_uri=http://localhost:3000/api/auth/callback&
  scope=threads_basic,threads_content_publish,threads_manage_insights,threads_manage_replies&
  response_type=code&
  state=RANDOM_STATE
```

**スコープの説明:**
- `threads_basic` - ユーザーの基本情報を取得
- `threads_content_publish` - 投稿の作成・公開
- `threads_manage_insights` - インサイトデータの取得
- `threads_manage_replies` - 返信の管理

**使用方法:**
1. メニューから「2」を選択
2. 生成されたURLが表示されます
3. ブラウザで開くか聞かれます（`y`で自動的に開きます）
4. Threadsアカウントでログインして承認
5. リダイレクト後のURLから認証コードを取得

### 3. トークン交換のテスト

OAuth認証後に取得した認証コードを、アクセストークンに交換します。

**手順:**
1. メニューから「3」を選択
2. 認証コードを入力（URLの`code=`パラメータの値）
3. トークン交換APIにリクエストを送信
4. 成功すると、アクセストークン情報が表示されます
5. 長期トークンへの変換を促されます

**取得できる情報:**
- `access_token` - アクセストークン（1時間有効）
- `token_type` - トークンの種類（通常は`Bearer`）
- `expires_in` - 有効期限（秒単位）

**実行例:**
```
🔄 トークン交換テスト
────────────────────────────────────────────────────────────
ℹ  トークン交換リクエストを送信中...

URL: https://graph.threads.net/oauth/access_token
Parameters:
  client_id: 1554440308880133
  client_secret: 2cee66d7...
  grant_type: authorization_code
  redirect_uri: http://localhost:3000/api/auth/callback
  code: AQBxyz123...

✓  トークン交換に成功しました

トークン情報:
  Access Token: IGQWROZAi12345...
  Token Type: Bearer
  Expires In: 3600秒 (1時間)
```

### 4. アクセストークンの検証

取得したアクセストークンが有効か確認し、ユーザー情報を取得します。

**手順:**
1. メニューから「4」を選択
2. アクセストークンを入力
3. Threads Graph APIにリクエストを送信
4. ユーザー情報が表示されます

**取得できる情報:**
- ユーザーID
- ユーザー名（@username）
- 表示名
- プロフィール画像URL

**実行例:**
```
🔐 アクセストークン検証
────────────────────────────────────────────────────────────
ℹ  ユーザー情報を取得中...
✓  アクセストークンは有効です

ユーザー情報:
  User ID: 1234567890
  Username: @yourname
  Name: Your Display Name
  Profile Picture: https://scontent.cdninstagram.com/...
```

### 5. 長期トークンへの変換

短期アクセストークン（1時間有効）を長期トークン（60日有効）に変換します。

**重要:** 長期トークンは定期的にリフレッシュすることで、無期限に使用できます。

**手順:**
1. メニューから「5」を選択
2. 短期アクセストークンを入力
3. トークンリフレッシュAPIにリクエストを送信
4. 長期トークンが表示されます

**実行例:**
```
🔄 長期トークンへの変換
────────────────────────────────────────────────────────────
ℹ  長期トークンへの変換リクエストを送信中...
✓  長期トークンへの変換に成功しました

長期トークン情報:
  Access Token: IGQWROZAi67890...
  Token Type: Bearer
  Expires In: 5184000秒 (約60日)
```

**トークンのリフレッシュ:**

長期トークンは60日後に期限切れになりますが、期限切れの24時間前にリフレッシュすることで、新しい60日間有効なトークンを取得できます。

### 6. フルフローテスト（推奨）

すべてのステップを自動で実行します。初めて使用する場合はこちらを推奨します。

**実行される内容:**
1. 環境変数の検証
2. OAuth認証URLの生成
3. ブラウザで認証URLを開く（オプション）
4. 認証コードの入力を促す
5. トークン交換
6. アクセストークンの検証
7. 長期トークンへの変換
8. 最終的な長期トークンの表示

**手順:**
1. メニューから「6」を選択
2. 画面の指示に従って進める
3. 最後に長期アクセストークンが表示される
4. そのトークンを`.env`ファイルに保存

**実行例:**
```
🚀 フルフローテスト
────────────────────────────────────────────────────────────

[環境変数の検証...]
[OAuth認証URLの生成...]

ℹ  次の手順を実行してください:

  1. Meta Developer Dashboardで以下のリダイレクトURIを設定:
     http://localhost:3000/api/auth/callback

  2. 以下の認証URLをブラウザで開く:
     https://threads.net/oauth/authorize?...

  3. Threadsアカウントでログインして承認

認証URLをブラウザで開きますか? (y/n): y
✓  ブラウザで開きました

認証後、リダイレクトURLから認証コードを入力してください: AQBxyz123...

[トークン交換...]
[アクセストークン検証...]
[長期トークン変換...]

✨ フルフローテスト完了
────────────────────────────────────────────────────────────

✓  すべてのテストが正常に完了しました！

長期アクセストークン:
IGQWROZAi67890abcdef1234567890...

ℹ  このトークンを .env ファイルに保存してください
```

## 🔧 トラブルシューティング

### エラー: "THREADS_APP_ID が設定されていません"

**原因:** `.env`ファイルに`THREADS_APP_ID`が設定されていない

**解決方法:**
1. `.env`ファイルを開く
2. `THREADS_APP_ID=your_app_id`を追加
3. Meta Developer Dashboardから正しいアプリIDをコピー

---

### エラー: "OAuthリダイレクトURIを記入してください"

**原因:** Meta Developer DashboardでリダイレクトURIが設定されていない

**解決方法:**
1. [Meta Developer Dashboard](https://developers.facebook.com/)を開く
2. アプリを選択
3. 「製品」→「Threads」→「設定」
4. 「有効なOAuthリダイレクトURI」に`http://localhost:3000/api/auth/callback`を追加
5. 保存

**別の方法:**
1. 「アプリの設定」→「ベーシック」
2. 「プラットフォームを追加」→「ウェブサイト」
3. サイトURL: `http://localhost:3000`
4. 保存

---

### エラー: "トークン交換に失敗しました"

**原因1:** 認証コードの期限切れ（発行から10分以内に使用する必要があります）

**解決方法:** 認証フローをやり直し、新しい認証コードを取得

**原因2:** リダイレクトURIの不一致

**解決方法:**
1. `.env`の`THREADS_REDIRECT_URI`を確認
2. Meta Developer Dashboardの設定と一致しているか確認
3. 大文字小文字、スラッシュの有無も完全一致させる

**原因3:** アプリIDまたはシークレットが間違っている

**解決方法:**
1. Meta Developer Dashboardで正しい値を確認
2. `.env`ファイルを更新

---

### エラー: "アクセストークンが無効です"

**原因:** トークンの期限切れまたは無効なトークン

**解決方法:**
1. 認証フローをやり直し、新しいトークンを取得
2. 長期トークンの場合は、リフレッシュする

---

### その他のエラー

**よくある問題:**
1. **ポート番号の不一致** - `.env`のリダイレクトURIとアプリの起動ポートが一致しているか確認
2. **ネットワークエラー** - インターネット接続を確認
3. **Meta APIの障害** - [Meta Status](https://status.fb.com/)で障害情報を確認

## 📚 参考リンク

- [Threads API ドキュメント](https://developers.facebook.com/docs/threads)
- [OAuth 2.0 認証フロー](https://developers.facebook.com/docs/threads/get-started/get-access-tokens-and-permissions)
- [Meta for Developers](https://developers.facebook.com/)
- [プロジェクトのREADME](./README.md)

## 💡 ヒント

### 開発環境と本番環境

開発環境（localhost）でテストした後、本番環境にデプロイする場合:

1. 本番環境のリダイレクトURIをMeta Developer Dashboardに追加
2. `.env.production`ファイルに本番用の設定を追加
3. 本番環境で認証フローを再度実行し、新しいトークンを取得

### トークンの安全な管理

- アクセストークンは**絶対に**公開リポジトリにコミットしない
- `.env`ファイルは`.gitignore`に含める
- 本番環境では環境変数として設定する（Vercel、Netlifyなど）

### トークンのリフレッシュ自動化

長期トークンは60日で期限切れになるため、定期的にリフレッシュする必要があります。以下のようなcronジョブを設定することを推奨します:

```bash
# 30日ごとにトークンをリフレッシュ
0 0 */30 * * node scripts/refresh-token.js
```

## 🎉 完了

これでThreads OAuthテストツールの使用方法は以上です。

何か問題があれば、以下を確認してください:
1. [トラブルシューティング](#トラブルシューティング)
2. [Threads APIドキュメント](https://developers.facebook.com/docs/threads)
3. プロジェクトの[Issues](https://github.com/your-repo/issues)

Happy Testing!
