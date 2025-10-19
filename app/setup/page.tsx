'use client'

import { useState } from 'react'
import { CheckCircle, Circle, ExternalLink, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SetupPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const steps = [
    {
      id: 1,
      title: 'Meta for Developers アカウント作成',
      description: 'Meta Developersでアカウントを作成し、ログインします',
    },
    {
      id: 2,
      title: 'アプリの作成',
      description: '新しいアプリを作成し、Threads APIを有効化します',
    },
    {
      id: 3,
      title: '環境変数の設定',
      description: 'アプリIDとシークレットを.envファイルに設定します',
    },
    {
      id: 4,
      title: 'OAuth設定',
      description: 'リダイレクトURIを設定します',
    },
    {
      id: 5,
      title: 'テスト',
      description: 'Threads APIとの接続をテストします',
    },
  ]

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    toast.success('コピーしました')
    setTimeout(() => setCopiedField(null), 2000)
  }

  const redirectUri = typeof window !== 'undefined'
    ? `${window.location.origin}/api/auth/callback`
    : 'http://localhost:3000/api/auth/callback'

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Threads API セットアップガイド
          </h1>
          <p className="text-muted-foreground">
            本番環境でThreads APIを使用するための設定手順
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => setCurrentStep(step.id)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                      currentStep === step.id
                        ? 'bg-primary text-primary-foreground'
                        : currentStep > step.id
                        ? 'bg-green-500 text-white'
                        : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <span className="font-semibold">{step.id}</span>
                    )}
                  </button>
                  <span className="text-xs mt-2 text-center hidden sm:block max-w-[100px]">
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition ${
                      currentStep > step.id ? 'bg-green-500' : 'bg-secondary'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-border">
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">
                ステップ 1: Meta for Developers アカウント作成
              </h2>

              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    📝 必要なもの
                  </h3>
                  <ul className="list-disc list-inside text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>Facebookアカウント（個人または ビジネス）</li>
                    <li>メールアドレス</li>
                    <li>電話番号（2段階認証用）</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <p className="text-foreground">1. Meta for Developersにアクセス：</p>
                  <a
                    href="https://developers.facebook.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Meta for Developersを開く
                  </a>

                  <p className="text-foreground mt-4">2. 右上の「始める」または「ログイン」をクリック</p>
                  <p className="text-foreground">3. Facebookアカウントでログイン</p>
                  <p className="text-foreground">4. 開発者として登録（初回のみ）</p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">
                ステップ 2: アプリの作成
              </h2>

              <div className="space-y-4">
                <div className="space-y-3">
                  <p className="text-foreground font-semibold">1. 新しいアプリを作成：</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground ml-4 space-y-2">
                    <li>「マイアプリ」→「アプリを作成」をクリック</li>
                    <li>アプリタイプ: 「Consumer」を選択</li>
                    <li>アプリ名: 任意（例: Threads Auto Poster）</li>
                    <li>連絡先メールアドレスを入力</li>
                  </ul>

                  <p className="text-foreground font-semibold mt-6">2. Threads製品を追加：</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground ml-4 space-y-2">
                    <li>ダッシュボードで「製品を追加」をクリック</li>
                    <li>「Threads」を探して「設定」をクリック</li>
                  </ul>

                  <p className="text-foreground font-semibold mt-6">3. アプリIDとシークレットを取得：</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground ml-4 space-y-2">
                    <li>左メニューの「設定」→「ベーシック」を開く</li>
                    <li>「アプリID」をコピー</li>
                    <li>「app secret」の「表示」をクリックしてコピー</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ アプリシークレットは絶対に公開しないでください。Gitにコミットしないよう注意してください。
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">
                ステップ 3: 環境変数の設定
              </h2>

              <div className="space-y-4">
                <p className="text-foreground">
                  プロジェクトルートの <code className="bg-secondary px-2 py-1 rounded">.env</code> ファイルに以下を設定してください：
                </p>

                <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 font-mono text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between group">
                      <span className="text-gray-300">THREADS_APP_ID=</span>
                      <span className="text-yellow-400">your-app-id-here</span>
                      <button
                        onClick={() => copyToClipboard('THREADS_APP_ID=your-app-id-here', 'app_id')}
                        className="opacity-0 group-hover:opacity-100 transition p-1 hover:bg-gray-800 rounded"
                      >
                        {copiedField === 'app_id' ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center justify-between group">
                      <span className="text-gray-300">THREADS_APP_SECRET=</span>
                      <span className="text-yellow-400">your-app-secret-here</span>
                      <button
                        onClick={() => copyToClipboard('THREADS_APP_SECRET=your-app-secret-here', 'app_secret')}
                        className="opacity-0 group-hover:opacity-100 transition p-1 hover:bg-gray-800 rounded"
                      >
                        {copiedField === 'app_secret' ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center justify-between group">
                      <span className="text-gray-300">THREADS_REDIRECT_URI=</span>
                      <span className="text-yellow-400">{redirectUri}</span>
                      <button
                        onClick={() => copyToClipboard(`THREADS_REDIRECT_URI=${redirectUri}`, 'redirect_uri')}
                        className="opacity-0 group-hover:opacity-100 transition p-1 hover:bg-gray-800 rounded"
                      >
                        {copiedField === 'redirect_uri' ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    💡 ヒント
                  </h3>
                  <ul className="list-disc list-inside text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>.env.exampleファイルをコピーして.envとして保存</li>
                    <li>上記の値を実際のアプリIDとシークレットに置き換え</li>
                    <li>設定後、開発サーバーを再起動してください</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">
                ステップ 4: OAuth リダイレクトURIの設定
              </h2>

              <div className="space-y-4">
                <p className="text-foreground">
                  Meta Developer Consoleで、OAuth リダイレクトURIを設定します：
                </p>

                <div className="space-y-3">
                  <p className="text-foreground font-semibold">1. Threads設定を開く：</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground ml-4 space-y-2">
                    <li>左メニューの「Threads」→「設定」を開く</li>
                    <li>「OAuth リダイレクトURI」セクションを探す</li>
                  </ul>

                  <p className="text-foreground font-semibold mt-6">2. リダイレクトURIを追加：</p>
                  <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 flex items-center justify-between">
                    <code className="text-yellow-400 font-mono text-sm">{redirectUri}</code>
                    <button
                      onClick={() => copyToClipboard(redirectUri, 'oauth_uri')}
                      className="p-2 hover:bg-gray-800 rounded transition"
                    >
                      {copiedField === 'oauth_uri' ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>

                  <ul className="list-disc list-inside text-sm text-muted-foreground ml-4 space-y-2">
                    <li>上記のURLをコピーして、Meta Developer Consoleに貼り付け</li>
                    <li>「変更を保存」をクリック</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                    ⚠️ 本番環境の場合
                  </h3>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    本番環境（Vercel、Netlifyなど）にデプロイする場合は、本番URLのリダイレクトURIも追加してください：
                  </p>
                  <code className="text-sm bg-yellow-100 dark:bg-yellow-900/40 px-2 py-1 rounded mt-2 block">
                    https://your-domain.com/api/auth/callback
                  </code>
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">
                ステップ 5: 接続テスト
              </h2>

              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                    ✅ 設定完了チェックリスト
                  </h3>
                  <ul className="space-y-2 text-sm text-green-800 dark:text-green-200">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Meta Developer アカウント作成済み
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      アプリ作成 & Threads製品追加済み
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      .envファイルに環境変数設定済み
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      OAuth リダイレクトURI設定済み
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      開発サーバー再起動済み
                    </li>
                  </ul>
                </div>

                <p className="text-foreground">
                  すべての設定が完了したら、Threads APIとの接続をテストしてください：
                </p>

                <a
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition font-semibold"
                >
                  ダッシュボードでテスト
                </a>

                <div className="mt-6 border-t border-border pt-6">
                  <h3 className="font-semibold text-foreground mb-3">
                    トラブルシューティング
                  </h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• <strong>認証エラー:</strong> アプリIDとシークレットを確認してください</p>
                    <p>• <strong>リダイレクトエラー:</strong> Meta Developer ConsoleのOAuth URIが正しいか確認</p>
                    <p>• <strong>権限エラー:</strong> Threadsアプリが「開発モード」になっているか確認</p>
                    <p>• <strong>環境変数が読み込まれない:</strong> 開発サーバーを再起動してください</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← 前へ
            </button>

            {currentStep < steps.length ? (
              <button
                onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
              >
                次へ →
              </button>
            ) : (
              <a
                href="/dashboard"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                完了してテスト →
              </a>
            )}
          </div>
        </div>

        {/* Quick links */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="https://developers.facebook.com/docs/threads"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-border hover:border-primary transition flex items-center gap-3"
          >
            <ExternalLink className="w-5 h-5 text-primary" />
            <div>
              <p className="font-semibold text-foreground">Threads API ドキュメント</p>
              <p className="text-xs text-muted-foreground">公式ドキュメントを確認</p>
            </div>
          </a>

          <a
            href="/dashboard?dev=true"
            className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-border hover:border-primary transition flex items-center gap-3"
          >
            <Circle className="w-5 h-5 text-primary" />
            <div>
              <p className="font-semibold text-foreground">開発モードで確認</p>
              <p className="text-xs text-muted-foreground">モックデータでテスト</p>
            </div>
          </a>

          <a
            href="/.env.example"
            download
            className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-border hover:border-primary transition flex items-center gap-3"
          >
            <Copy className="w-5 h-5 text-primary" />
            <div>
              <p className="font-semibold text-foreground">.env.example</p>
              <p className="text-xs text-muted-foreground">環境変数テンプレート</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}
